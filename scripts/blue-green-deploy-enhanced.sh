#!/bin/bash

# Enhanced Blue-Green Deployment Script for ScrapeMaster
# Supports automated health checks, rollback mechanisms, and environment management

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-datavault-pro}"
APP_NAME="${APP_NAME:-datavault-pro}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-ghcr.io/ibrahimsohofi}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
DATADOG_API_KEY="${DATADOG_API_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Notification functions
send_slack_notification() {
    local message="$1"
    local color="${2:-good}" # good, warning, danger

    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK" || log_warning "Failed to send Slack notification"
    fi
}

send_datadog_event() {
    local title="$1"
    local text="$2"
    local alert_type="${3:-info}" # info, success, warning, error

    if [[ -n "$DATADOG_API_KEY" ]]; then
        curl -X POST "https://api.datadoghq.com/api/v1/events" \
            -H "Content-Type: application/json" \
            -H "DD-API-KEY: ${DATADOG_API_KEY}" \
            -d "{
                \"title\": \"$title\",
                \"text\": \"$text\",
                \"alert_type\": \"$alert_type\",
                \"tags\": [\"deployment\", \"blue-green\", \"datavault-pro\"]
            }" || log_warning "Failed to send DataDog event"
    fi
}

# Utility functions
get_current_color() {
    kubectl get service "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "none"
}

get_target_color() {
    local current=$(get_current_color)
    if [[ "$current" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is required but not installed"
        exit 1
    fi

    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace $NAMESPACE does not exist"
        exit 1
    fi

    # Check if image exists
    if ! docker manifest inspect "$REGISTRY/$APP_NAME:$IMAGE_TAG" &> /dev/null; then
        log_warning "Cannot verify image existence: $REGISTRY/$APP_NAME:$IMAGE_TAG"
    fi

    log_success "Prerequisites check passed"
}

create_deployment_manifest() {
    local color="$1"
    local replicas="${2:-3}"

    cat <<EOF > "/tmp/${APP_NAME}-${color}-deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${APP_NAME}-${color}
  namespace: ${NAMESPACE}
  labels:
    app: ${APP_NAME}
    version: ${color}
    deployment-type: blue-green
  annotations:
    deployment.kubernetes.io/revision: "$(date +%s)"
spec:
  replicas: ${replicas}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: ${APP_NAME}
      version: ${color}
  template:
    metadata:
      labels:
        app: ${APP_NAME}
        version: ${color}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/api/metrics"
        deployment.timestamp: "$(date +%s)"
    spec:
      containers:
      - name: ${APP_NAME}
        image: ${REGISTRY}/${APP_NAME}:${IMAGE_TAG}
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ${APP_NAME}-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ${APP_NAME}-secrets
              key: jwt-secret
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: ${APP_NAME}-secrets
              key: redis-url
        - name: DATADOG_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${APP_NAME}-secrets
              key: datadog-api-key
              optional: true
        - name: NEW_RELIC_LICENSE_KEY
          valueFrom:
            secretKeyRef:
              name: ${APP_NAME}-secrets
              key: newrelic-license-key
              optional: true
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
      imagePullSecrets:
      - name: registry-secret
EOF
}

deploy_target_environment() {
    local target_color="$1"

    log_info "Deploying $target_color environment..."

    # Create deployment manifest
    create_deployment_manifest "$target_color"

    # Apply deployment
    kubectl apply -f "/tmp/${APP_NAME}-${target_color}-deployment.yaml"

    # Wait for deployment to be ready
    log_info "Waiting for $target_color deployment to be ready..."
    if ! kubectl rollout status deployment/"${APP_NAME}-${target_color}" -n "$NAMESPACE" --timeout=${HEALTH_CHECK_TIMEOUT}s; then
        log_error "Deployment rollout failed for $target_color environment"
        return 1
    fi

    log_success "$target_color environment deployed successfully"
    return 0
}

perform_health_checks() {
    local target_color="$1"
    local retries=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))

    log_info "Performing health checks for $target_color environment..."

    # Get pod IPs for direct health checks
    local pod_ips
    pod_ips=$(kubectl get pods -n "$NAMESPACE" -l "app=$APP_NAME,version=$target_color" -o jsonpath='{.items[*].status.podIP}')

    if [[ -z "$pod_ips" ]]; then
        log_error "No pods found for $target_color environment"
        return 1
    fi

    for ((i=1; i<=retries; i++)); do
        log_info "Health check attempt $i/$retries..."

        local all_healthy=true
        for pod_ip in $pod_ips; do
            if ! curl -f -s "http://$pod_ip:3000/api/health" >/dev/null; then
                all_healthy=false
                break
            fi
        done

        if [[ "$all_healthy" == "true" ]]; then
            log_success "All pods in $target_color environment are healthy"

            # Additional application-specific health checks
            if perform_application_health_checks "$target_color"; then
                return 0
            fi
        fi

        if [[ $i -lt $retries ]]; then
            log_info "Waiting ${HEALTH_CHECK_INTERVAL}s before next health check..."
            sleep "$HEALTH_CHECK_INTERVAL"
        fi
    done

    log_error "Health checks failed for $target_color environment"
    return 1
}

perform_application_health_checks() {
    local target_color="$1"

    log_info "Performing application-specific health checks..."

    # Create a temporary service for testing
    kubectl expose deployment "${APP_NAME}-${target_color}" \
        --name="${APP_NAME}-${target_color}-test" \
        --port=3000 \
        --target-port=3000 \
        -n "$NAMESPACE" || true

    # Port forward for testing
    kubectl port-forward -n "$NAMESPACE" "service/${APP_NAME}-${target_color}-test" 8080:3000 &
    local port_forward_pid=$!

    sleep 5

    # Test API endpoints
    local tests_passed=true

    if ! curl -f -s "http://localhost:8080/api/health" | grep -q "ok"; then
        log_error "Health endpoint test failed"
        tests_passed=false
    fi

    if ! curl -f -s "http://localhost:8080/api/auth/login" >/dev/null; then
        log_error "Auth endpoint test failed"
        tests_passed=false
    fi

    # Clean up
    kill $port_forward_pid 2>/dev/null || true
    kubectl delete service "${APP_NAME}-${target_color}-test" -n "$NAMESPACE" || true

    if [[ "$tests_passed" == "true" ]]; then
        log_success "Application health checks passed"
        return 0
    else
        log_error "Application health checks failed"
        return 1
    fi
}

switch_traffic() {
    local target_color="$1"

    log_info "Switching traffic to $target_color environment..."

    # Update service selector
    kubectl patch service "$APP_NAME" -n "$NAMESPACE" -p '{"spec":{"selector":{"version":"'$target_color'"}}}'

    # Wait a moment for the change to propagate
    sleep 5

    # Verify the switch
    local current_color
    current_color=$(get_current_color)
    if [[ "$current_color" == "$target_color" ]]; then
        log_success "Traffic successfully switched to $target_color environment"
        return 0
    else
        log_error "Traffic switch verification failed"
        return 1
    fi
}

cleanup_old_environment() {
    local old_color="$1"
    local keep_old="${2:-false}"

    if [[ "$keep_old" == "true" ]]; then
        log_info "Keeping old $old_color environment for manual cleanup"
        return 0
    fi

    log_info "Cleaning up old $old_color environment..."

    # Scale down old deployment
    kubectl scale deployment "${APP_NAME}-${old_color}" --replicas=0 -n "$NAMESPACE" || true

    # Wait a bit before deletion
    sleep 30

    # Delete old deployment
    kubectl delete deployment "${APP_NAME}-${old_color}" -n "$NAMESPACE" || true

    log_success "Old $old_color environment cleaned up"
}

rollback_deployment() {
    local failed_color="$1"
    local rollback_color="$2"

    log_error "Rolling back deployment due to health check failures"

    # Switch traffic back
    if kubectl get deployment "${APP_NAME}-${rollback_color}" -n "$NAMESPACE" &>/dev/null; then
        log_info "Switching traffic back to $rollback_color environment..."
        switch_traffic "$rollback_color"
    fi

    # Clean up failed deployment
    log_info "Cleaning up failed $failed_color deployment..."
    kubectl delete deployment "${APP_NAME}-${failed_color}" -n "$NAMESPACE" || true

    # Send notifications
    send_slack_notification "🚨 Deployment rollback completed for ScrapeMaster. Reverted to $rollback_color environment." "danger"
    send_datadog_event "Deployment Rollback" "Blue-green deployment failed and was rolled back to $rollback_color environment" "error"
}

main() {
    log_info "Starting enhanced blue-green deployment for ScrapeMaster..."

    # Check prerequisites
    check_prerequisites

    # Get current and target colors
    local current_color
    current_color=$(get_current_color)
    local target_color
    target_color=$(get_target_color)

    log_info "Current environment: $current_color"
    log_info "Target environment: $target_color"
    log_info "Image: $REGISTRY/$APP_NAME:$IMAGE_TAG"

    # Send deployment start notification
    send_slack_notification "🚀 Starting blue-green deployment for ScrapeMaster to $target_color environment" "good"
    send_datadog_event "Deployment Started" "Blue-green deployment started for target environment: $target_color" "info"

    # Deploy target environment
    if ! deploy_target_environment "$target_color"; then
        log_error "Failed to deploy $target_color environment"
        send_slack_notification "❌ Failed to deploy $target_color environment for ScrapeMaster" "danger"
        send_datadog_event "Deployment Failed" "Failed to deploy $target_color environment" "error"
        exit 1
    fi

    # Perform health checks
    if ! perform_health_checks "$target_color"; then
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment "$target_color" "$current_color"
        fi
        send_slack_notification "❌ Health checks failed for $target_color environment" "danger"
        send_datadog_event "Health Check Failed" "Health checks failed for $target_color environment" "error"
        exit 1
    fi

    # Switch traffic
    if ! switch_traffic "$target_color"; then
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment "$target_color" "$current_color"
        fi
        send_slack_notification "❌ Failed to switch traffic to $target_color environment" "danger"
        send_datadog_event "Traffic Switch Failed" "Failed to switch traffic to $target_color environment" "error"
        exit 1
    fi

    # Clean up old environment
    if [[ "$current_color" != "none" ]]; then
        cleanup_old_environment "$current_color" "${KEEP_OLD_ENVIRONMENT:-false}"
    fi

    # Success notifications
    log_success "Blue-green deployment completed successfully!"
    log_success "ScrapeMaster is now running on $target_color environment"

    send_slack_notification "✅ Blue-green deployment completed successfully! ScrapeMaster is now running on $target_color environment." "good"
    send_datadog_event "Deployment Success" "Blue-green deployment completed successfully on $target_color environment" "success"

    # Cleanup temporary files
    rm -f "/tmp/${APP_NAME}-${target_color}-deployment.yaml"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
