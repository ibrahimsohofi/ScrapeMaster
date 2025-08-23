#!/bin/bash
# =============================================================================
# DataVault Pro Deployment Script
# Comprehensive deployment automation for development, staging, and production
# =============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
ACTION="deploy"
SKIP_TESTS=false
FORCE=false
VERBOSE=false

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${PURPLE}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    fi
}

show_usage() {
    cat << EOF
🚀 DataVault Pro Deployment Script

Usage: $0 [OPTIONS] ACTION ENVIRONMENT

Actions:
    deploy      Deploy the application
    start       Start existing services
    stop        Stop all services
    restart     Restart all services
    logs        Show service logs
    status      Show service status
    backup      Create database backup
    restore     Restore from backup
    update      Update to latest version
    cleanup     Clean up unused resources

Environments:
    development  Local development with all debugging tools
    staging      Staging environment for testing
    production   Production environment with HA and monitoring

Options:
    -h, --help           Show this help message
    -f, --force          Force operation without confirmation
    -s, --skip-tests     Skip running tests before deployment
    -v, --verbose        Enable verbose logging
    --no-cache           Build without Docker cache
    --scale N            Scale application instances (production only)

Examples:
    $0 deploy development
    $0 deploy production --force
    $0 start development
    $0 logs production
    $0 backup production
    $0 update staging --skip-tests

Environment Variables:
    Set these in .env.{environment} files:
    - DATABASE_URL
    - JWT_SECRET
    - OPENAI_API_KEY
    - REDIS_URL
    - Various API keys for integrations

EOF
}

check_requirements() {
    log_info "Checking system requirements..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check Bun for development builds
    if [ "$ENVIRONMENT" = "development" ] && ! command -v bun &> /dev/null; then
        log_warning "Bun is not installed. Some development features may not work."
    fi

    log_success "System requirements check passed"
}

load_environment() {
    log_info "Loading environment configuration for: $ENVIRONMENT"

    ENV_FILE=".env.${ENVIRONMENT}"
    if [ -f "$ENV_FILE" ]; then
        log_debug "Loading environment from $ENV_FILE"
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
        log_success "Environment loaded from $ENV_FILE"
    else
        log_warning "Environment file $ENV_FILE not found. Using defaults."
    fi

    # Set build-time variables
    export BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

    log_debug "BUILD_TIME: $BUILD_TIME"
    log_debug "COMMIT_SHA: $COMMIT_SHA"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests as requested"
        return 0
    fi

    log_info "Running tests..."

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        bun install
    fi

    # Run linting
    log_info "Running linting checks..."
    bun run lint || {
        log_error "Linting failed"
        return 1
    }

    # Run unit tests
    log_info "Running unit tests..."
    bun run test:run || {
        log_error "Unit tests failed"
        return 1
    }

    log_success "All tests passed"
}

build_application() {
    log_info "Building application for $ENVIRONMENT..."

    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file $COMPOSE_FILE not found"
        exit 1
    fi

    BUILD_ARGS=""
    if [ "$NO_CACHE" = true ]; then
        BUILD_ARGS="--no-cache"
    fi

    log_info "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" build $BUILD_ARGS

    log_success "Application built successfully"
}

deploy_application() {
    log_info "Deploying DataVault Pro to $ENVIRONMENT..."

    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

    # Stop existing services if running
    log_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true

    # Create necessary directories
    mkdir -p logs uploads backups

    # Start database first for migrations
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Starting database cluster..."
        docker-compose -f "$COMPOSE_FILE" up -d postgres-primary postgres-replica redis-cluster

        # Wait for database to be ready
        log_info "Waiting for database to be ready..."
        sleep 30

        # Run database migrations
        log_info "Running database migrations..."
        docker-compose -f "$COMPOSE_FILE" run --rm app-1 sh -c "cd /app && bun run db:push"

        # Start all services
        log_info "Starting all services..."
        docker-compose -f "$COMPOSE_FILE" up -d

        # Scale application instances if specified
        if [ -n "$SCALE" ]; then
            log_info "Scaling application to $SCALE instances..."
            docker-compose -f "$COMPOSE_FILE" up -d --scale app-1=$SCALE --scale app-2=$SCALE --scale app-3=$SCALE
        fi

    else
        # Development/staging deployment
        log_info "Starting all services..."
        docker-compose -f "$COMPOSE_FILE" up -d

        # Wait for app to be ready and run migrations
        log_info "Waiting for application to be ready..."
        sleep 20

        # Database should auto-migrate via entrypoint script
    fi

    log_success "Deployment completed successfully"

    # Show service status
    show_status

    # Show access URLs
    show_urls
}

start_services() {
    log_info "Starting DataVault Pro services for $ENVIRONMENT..."

    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    docker-compose -f "$COMPOSE_FILE" up -d

    log_success "Services started"
    show_status
}

stop_services() {
    log_info "Stopping DataVault Pro services for $ENVIRONMENT..."

    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    docker-compose -f "$COMPOSE_FILE" down

    log_success "Services stopped"
}

restart_services() {
    log_info "Restarting DataVault Pro services for $ENVIRONMENT..."

    stop_services
    sleep 5
    start_services
}

show_logs() {
    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

    if [ -n "$SERVICE" ]; then
        log_info "Showing logs for service: $SERVICE"
        docker-compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
    else
        log_info "Showing logs for all services..."
        docker-compose -f "$COMPOSE_FILE" logs -f
    fi
}

show_status() {
    log_info "Service Status for $ENVIRONMENT:"

    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    docker-compose -f "$COMPOSE_FILE" ps
}

show_urls() {
    log_info "Access URLs for $ENVIRONMENT:"

    case $ENVIRONMENT in
        "development")
            echo -e "${CYAN}Application:${NC}      http://localhost:3000"
            echo -e "${CYAN}Prisma Studio:${NC}    http://localhost:5555"
            echo -e "${CYAN}pgAdmin:${NC}          http://localhost:8080"
            echo -e "${CYAN}Redis Commander:${NC}  http://localhost:8081"
            echo -e "${CYAN}Grafana:${NC}          http://localhost:3001"
            echo -e "${CYAN}Prometheus:${NC}       http://localhost:9090"
            echo -e "${CYAN}Chrome Pool:${NC}      http://localhost:3003"
            ;;
        "production")
            echo -e "${CYAN}Application:${NC}      https://datavault.pro"
            echo -e "${CYAN}HAProxy Stats:${NC}    http://your-domain:8404"
            echo -e "${CYAN}Grafana:${NC}          https://grafana.datavault.pro"
            echo -e "${CYAN}Prometheus:${NC}       https://prometheus.datavault.pro"
            ;;
        "staging")
            echo -e "${CYAN}Application:${NC}      https://staging.datavault.pro"
            ;;
    esac
}

backup_database() {
    log_info "Creating database backup for $ENVIRONMENT..."

    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"

    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" exec postgres-primary pg_dump -U postgres datavault_pro > "backups/$BACKUP_FILE"
    else
        docker-compose -f "$COMPOSE_FILE" exec postgres pg_dump -U postgres datavault_dev > "backups/$BACKUP_FILE"
    fi

    log_success "Database backup saved to: backups/$BACKUP_FILE"
}

update_application() {
    log_info "Updating DataVault Pro to latest version..."

    # Pull latest code
    git pull origin main

    # Rebuild and deploy
    build_application
    deploy_application

    log_success "Application updated successfully"
}

cleanup_resources() {
    log_info "Cleaning up unused Docker resources..."

    # Remove stopped containers
    docker container prune -f

    # Remove unused images
    docker image prune -f

    # Remove unused volumes (be careful!)
    if [ "$FORCE" = true ]; then
        docker volume prune -f
    fi

    # Remove unused networks
    docker network prune -f

    log_success "Cleanup completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --scale)
            SCALE="$2"
            shift 2
            ;;
        --service)
            SERVICE="$2"
            shift 2
            ;;
        -*)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$ACTION" ]; then
                ACTION="$1"
            elif [ -z "$ENVIRONMENT" ]; then
                ENVIRONMENT="$1"
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [ -z "$ACTION" ]; then
    log_error "Action is required"
    show_usage
    exit 1
fi

if [ -z "$ENVIRONMENT" ]; then
    log_error "Environment is required"
    show_usage
    exit 1
fi

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Valid environments: development, staging, production"
        exit 1
        ;;
esac

# Main execution
log_info "🚀 DataVault Pro Deployment Script"
log_info "Action: $ACTION"
log_info "Environment: $ENVIRONMENT"
log_info "Build Time: $(date '+%Y-%m-%d %H:%M:%S')"

# Check requirements
check_requirements

# Load environment
load_environment

# Execute action
case $ACTION in
    deploy)
        if [ "$ENVIRONMENT" != "development" ] && [ "$FORCE" != true ]; then
            echo -e "${YELLOW}⚠️  You are about to deploy to $ENVIRONMENT${NC}"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Deployment cancelled"
                exit 0
            fi
        fi

        run_tests
        build_application
        deploy_application
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    backup)
        backup_database
        ;;
    update)
        update_application
        ;;
    cleanup)
        cleanup_resources
        ;;
    *)
        log_error "Invalid action: $ACTION"
        show_usage
        exit 1
        ;;
esac

log_success "Operation completed successfully! 🎉"
