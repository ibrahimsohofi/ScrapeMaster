#!/bin/bash

# DataVault Pro Deployment Script
# Supports multiple deployment environments: development, staging, production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="datavault-pro"
DOCKER_IMAGE="$PROJECT_NAME"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    local missing_tools=()

    if ! command_exists docker; then
        missing_tools+=("docker")
    fi

    if ! command_exists docker-compose; then
        missing_tools+=("docker-compose")
    fi

    if ! command_exists bun; then
        missing_tools+=("bun")
    fi

    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install missing tools and run again."
        exit 1
    fi

    print_success "All prerequisites satisfied"
}

# Function to create backup
create_backup() {
    local env="$1"
    print_status "Creating backup for $env environment..."

    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/backup-$env-$(date +%Y%m%d-%H%M%S).tar.gz"

    # Backup database if it exists
    if docker-compose ps | grep -q postgres; then
        print_status "Backing up database..."
        docker-compose exec -T postgres pg_dump -U postgres datavault_pro > "$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql"
    fi

    # Backup uploaded files and logs
    if [ -d "./uploads" ] || [ -d "./logs" ]; then
        tar -czf "$backup_file" uploads/ logs/ 2>/dev/null || true
        print_success "Backup created: $backup_file"
    fi
}

# Function to setup environment
setup_environment() {
    local env="$1"
    print_status "Setting up $env environment..."

    # Copy appropriate env file
    case "$env" in
        "development")
            if [ ! -f ".env.local" ]; then
                cp ".env.example" ".env.local" 2>/dev/null || {
                    print_warning ".env.example not found, creating basic .env.local"
                    cat > .env.local << EOF
NODE_ENV=development
DATABASE_URL=file:./dev.db
JWT_SECRET=dev-secret-key-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
                }
            fi
            ;;
        "production")
            if [ ! -f ".env.production" ]; then
                print_error ".env.production file is required for production deployment"
                print_error "Please create .env.production with your production configuration"
                exit 1
            fi
            cp ".env.production" ".env.local"
            ;;
        "staging")
            if [ ! -f ".env.staging" ]; then
                print_warning ".env.staging not found, using .env.production"
                cp ".env.production" ".env.local"
            else
                cp ".env.staging" ".env.local"
            fi
            ;;
    esac

    print_success "Environment configured for $env"
}

# Function to deploy with Docker
deploy_docker() {
    local env="$1"
    print_status "Deploying with Docker for $env environment..."

    # Build and start services
    if [ "$env" = "production" ]; then
        print_status "Building production images..."
        docker-compose -f docker-compose.yml build --no-cache

        print_status "Starting production services..."
        docker-compose -f docker-compose.yml up -d

        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 30

        # Run database migrations
        print_status "Running database migrations..."
        docker-compose exec app bun run db:push
        docker-compose exec app bun run db:seed

    else
        print_status "Starting development services..."
        docker-compose -f docker-compose.dev.yml up -d
    fi

    print_success "Docker deployment completed"
}

# Function to deploy to Netlify
deploy_netlify() {
    print_status "Preparing Netlify deployment..."

    # Check if Netlify CLI is installed
    if ! command_exists netlify; then
        print_error "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi

    # Build for static export
    print_status "Building for static export..."
    bun run build

    # Deploy to Netlify
    print_status "Deploying to Netlify..."
    if [ "$1" = "production" ]; then
        netlify deploy --prod --dir=out
    else
        netlify deploy --dir=out
    fi

    print_success "Netlify deployment completed"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Preparing Vercel deployment..."

    # Check if Vercel CLI is installed
    if ! command_exists vercel; then
        print_error "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi

    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    if [ "$1" = "production" ]; then
        vercel --prod
    else
        vercel
    fi

    print_success "Vercel deployment completed"
}

# Function to run health checks
health_check() {
    local base_url="$1"
    print_status "Running health checks..."

    local retries=0
    local max_retries=30

    while [ $retries -lt $max_retries ]; do
        if curl -f "$base_url/api/health" >/dev/null 2>&1; then
            print_success "Application is healthy"
            return 0
        fi

        retries=$((retries + 1))
        print_status "Waiting for application to be ready... ($retries/$max_retries)"
        sleep 10
    done

    print_error "Health check failed after $max_retries attempts"
    return 1
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] ENVIRONMENT PLATFORM"
    echo ""
    echo "ENVIRONMENT:"
    echo "  development    Deploy to development environment"
    echo "  staging        Deploy to staging environment"
    echo "  production     Deploy to production environment"
    echo ""
    echo "PLATFORM:"
    echo "  docker         Deploy using Docker Compose"
    echo "  netlify        Deploy to Netlify"
    echo "  vercel         Deploy to Vercel"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  -b, --backup   Create backup before deployment"
    echo "  -s, --skip-checks   Skip health checks"
    echo "  -v, --verbose  Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 development docker"
    echo "  $0 production netlify --backup"
    echo "  $0 staging vercel"
}

# Main deployment function
main() {
    local environment=""
    local platform=""
    local create_backup_flag=false
    local skip_checks=false
    local verbose=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -b|--backup)
                create_backup_flag=true
                shift
                ;;
            -s|--skip-checks)
                skip_checks=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                set -x
                shift
                ;;
            development|staging|production)
                environment="$1"
                shift
                ;;
            docker|netlify|vercel)
                platform="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate arguments
    if [ -z "$environment" ] || [ -z "$platform" ]; then
        print_error "Environment and platform are required"
        show_usage
        exit 1
    fi

    # Start deployment
    print_status "Starting deployment: $environment on $platform"
    echo "$(date): Starting $environment deployment on $platform" >> "$LOG_FILE"

    # Check prerequisites
    check_prerequisites

    # Create backup if requested
    if [ "$create_backup_flag" = true ]; then
        create_backup "$environment"
    fi

    # Setup environment
    setup_environment "$environment"

    # Deploy based on platform
    case "$platform" in
        "docker")
            deploy_docker "$environment"
            if [ "$skip_checks" = false ]; then
                health_check "http://localhost:3000"
            fi
            ;;
        "netlify")
            deploy_netlify "$environment"
            ;;
        "vercel")
            deploy_vercel "$environment"
            ;;
        *)
            print_error "Unknown platform: $platform"
            exit 1
            ;;
    esac

    print_success "Deployment completed successfully!"
    echo "$(date): Deployment completed successfully" >> "$LOG_FILE"

    # Show final information
    echo ""
    print_status "Deployment Summary:"
    echo "  Environment: $environment"
    echo "  Platform: $platform"
    echo "  Timestamp: $(date)"
    echo "  Log file: $LOG_FILE"

    if [ "$platform" = "docker" ]; then
        echo ""
        print_status "Docker Services:"
        docker-compose ps
        echo ""
        print_status "Application URLs:"
        echo "  Main App: http://localhost:3000"
        echo "  Health Check: http://localhost:3000/api/health"
        if docker-compose ps | grep -q grafana; then
            echo "  Grafana: http://localhost:3001"
        fi
        if docker-compose ps | grep -q prometheus; then
            echo "  Prometheus: http://localhost:9090"
        fi
    fi
}

# Run main function with all arguments
main "$@"
