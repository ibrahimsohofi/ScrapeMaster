#!/bin/bash

# Blue-Green Deployment Script for DataVault Pro
# This script automates zero-downtime deployments using Kubernetes

set -euo pipefail

# Configuration
NAMESPACE="datavault-pro"
APP_NAME="datavault-pro"
IMAGE_TAG="${1:-latest}"
TIMEOUT=300
HEALTH_CHECK_RETRIES=10
ROLLBACK_ON_FAILURE=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        error "Unable to connect to Kubernetes cluster"
        exit 1
    fi

    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        error "Namespace $NAMESPACE does not exist"
        exit 1
    fi

    log "Prerequisites check passed"
}

# Get current active version (blue or green)
get_active_version() {
    kubectl get service "${APP_NAME}-active" -n "$NAMESPACE" -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue"
}

# Get inactive version
get_inactive_version() {
    local active_version="$1"
    if [ "$active_version" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Wait for deployment to be ready
wait_for_deployment() {
    local deployment_name="$1"
    local timeout="$2"

    log "Waiting for deployment $deployment_name to be ready (timeout: ${timeout}s)..."

    if kubectl wait --for=condition=available deployment/"$deployment_name" -n "$NAMESPACE" --timeout="${timeout}s"; then
        log "Deployment $deployment_name is ready"
        return 0
    else
        error "Deployment $deployment_name failed to become ready within ${timeout}s"
        return 1
    fi
}

# Health check function
health_check() {
    local service_name="$1"
    local retries="$2"

    log "Performing health check on service $service_name..."

    for i in $(seq 1 "$retries"); do
        if kubectl run health-check-pod-"$i" \
            --image=curlimages/curl:latest \
            --restart=Never \
            --rm -i \
            --namespace="$NAMESPACE" \
            --timeout=30s \
            -- curl -f "http://${service_name}/api/health" &> /dev/null; then
            log "Health check passed for $service_name"
            return 0
        else
            warn "Health check attempt $i/$retries failed for $service_name"
            sleep 5
        fi
    done

    error "Health check failed for $service_name after $retries attempts"
    return 1
}

# Switch traffic to new version
switch_traffic() {
    local new_version="$1"

    log "Switching traffic to $new_version version..."

    kubectl patch service "${APP_NAME}-active" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"version\":\"$new_version\"}}}"

    log "Traffic switched to $new_version version"
}

# Scale deployment
scale_deployment() {
    local deployment_name="$1"
    local replicas="$2"

    log "Scaling $deployment_name to $replicas replicas..."
    kubectl scale deployment "$deployment_name" -n "$NAMESPACE" --replicas="$replicas"
}

# Rollback function
rollback() {
    local original_version="$1"

    error "Deployment failed, initiating rollback to $original_version..."

    # Switch traffic back
    switch_traffic "$original_version"

    # Scale down the failed deployment
    local failed_version
    failed_version=$(get_inactive_version "$original_version")
    scale_deployment "${APP_NAME}-${failed_version}" 0

    error "Rollback completed. Traffic restored to $original_version version"
}

# Generate deployment report
generate_report() {
    local deployment_result="$1"
    local start_time="$2"
    local end_time="$3"
    local active_version="$4"

    local duration=$((end_time - start_time))

    cat << EOF

╔══════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT REPORT                        ║
╚══════════════════════════════════════════════════════════════╝

Application: $APP_NAME
Namespace: $NAMESPACE
Image Tag: $IMAGE_TAG
Result: $deployment_result
Duration: ${duration}s
Active Version: $active_version
Timestamp: $(date)

Deployment Summary:
$(kubectl get deployments -n "$NAMESPACE" -l app="$APP_NAME" -o wide)

Service Status:
$(kubectl get services -n "$NAMESPACE" -l app="$APP_NAME" -o wide)

Pod Status:
$(kubectl get pods -n "$NAMESPACE" -l app="$APP_NAME" -o wide)

EOF
}

# Cleanup old images (optional)
cleanup_old_images() {
    log "Cleaning up old container images..."
    # This would typically be handled by your CI/CD system or image registry policies
    # For demonstration purposes, we'll just log the action
    info "Image cleanup would be performed here in a real environment"
}

# Main deployment function
main() {
    local start_time
    start_time=$(date +%s)

    log "Starting blue-green deployment for $APP_NAME:$IMAGE_TAG"

    # Check prerequisites
    check_prerequisites

    # Get current state
    local active_version
    active_version=$(get_active_version)
    local inactive_version
    inactive_version=$(get_inactive_version "$active_version")

    info "Current active version: $active_version"
    info "Deploying to version: $inactive_version"

    # Update the inactive deployment with new image
    log "Updating ${APP_NAME}-${inactive_version} deployment with image $IMAGE_TAG..."
    kubectl set image deployment/"${APP_NAME}-${inactive_version}" \
        -n "$NAMESPACE" \
        "${APP_NAME}=${APP_NAME}:${IMAGE_TAG}"

    # Scale up the inactive deployment
    scale_deployment "${APP_NAME}-${inactive_version}" 3

    # Wait for new deployment to be ready
    if ! wait_for_deployment "${APP_NAME}-${inactive_version}" "$TIMEOUT"; then
        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
            rollback "$active_version"
        fi
        exit 1
    fi

    # Perform health check on new deployment
    if ! health_check "${APP_NAME}-${inactive_version}" "$HEALTH_CHECK_RETRIES"; then
        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
            rollback "$active_version"
        fi
        exit 1
    fi

    # Switch traffic to new version
    switch_traffic "$inactive_version"

    # Give some time for traffic to stabilize
    log "Waiting for traffic to stabilize..."
    sleep 30

    # Final health check on the active service
    if ! health_check "${APP_NAME}-active" 3; then
        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
            rollback "$active_version"
        fi
        exit 1
    fi

    # Scale down the old deployment
    log "Scaling down old deployment..."
    scale_deployment "${APP_NAME}-${active_version}" 0

    # Update HPA target if needed
    log "Updating HPA target to new deployment..."
    kubectl patch hpa "${APP_NAME}-hpa" -n "$NAMESPACE" \
        -p "{\"spec\":{\"scaleTargetRef\":{\"name\":\"${APP_NAME}-${inactive_version}\"}}}"

    local end_time
    end_time=$(date +%s)

    # Generate deployment report
    generate_report "SUCCESS" "$start_time" "$end_time" "$inactive_version"

    # Optional cleanup
    cleanup_old_images

    log "Blue-green deployment completed successfully!"
    log "Active version is now: $inactive_version"
}

# Script usage
usage() {
    cat << EOF
Usage: $0 [IMAGE_TAG]

Blue-Green Deployment Script for DataVault Pro

Arguments:
  IMAGE_TAG    Container image tag to deploy (default: latest)

Environment Variables:
  NAMESPACE               Kubernetes namespace (default: datavault-pro)
  TIMEOUT                 Deployment timeout in seconds (default: 300)
  HEALTH_CHECK_RETRIES    Number of health check retries (default: 10)
  ROLLBACK_ON_FAILURE     Whether to rollback on failure (default: true)

Examples:
  $0                      # Deploy latest tag
  $0 v1.2.3              # Deploy specific version
  TIMEOUT=600 $0 v1.2.3  # Deploy with custom timeout

EOF
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
