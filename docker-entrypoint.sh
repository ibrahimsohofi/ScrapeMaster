#!/bin/sh
# =============================================================================
# DataVault Pro Docker Entrypoint Script
# Handles database migrations, health checks, and application startup
# =============================================================================

set -e

# Color codes for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Function to wait for database to be ready
wait_for_db() {
    log_info "Waiting for database to be ready..."

    if [ -n "$DATABASE_URL" ]; then
        # Extract database type from URL
        if echo "$DATABASE_URL" | grep -q "postgresql://\|postgres://"; then
            # PostgreSQL database
            DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
            DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

            log_info "Checking PostgreSQL connection to $DB_HOST:$DB_PORT"

            while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
                log_info "Waiting for PostgreSQL to be ready..."
                sleep 2
            done

            log_success "PostgreSQL is ready!"

        elif echo "$DATABASE_URL" | grep -q "mysql://"; then
            # MySQL database
            DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
            DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

            log_info "Checking MySQL connection to $DB_HOST:$DB_PORT"

            while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
                log_info "Waiting for MySQL to be ready..."
                sleep 2
            done

            log_success "MySQL is ready!"

        elif echo "$DATABASE_URL" | grep -q "file:"; then
            # SQLite database
            log_info "Using SQLite database"

            # Ensure directory exists
            DB_DIR=$(dirname "${DATABASE_URL#file:}")
            mkdir -p "$DB_DIR"

            log_success "SQLite database directory ready!"
        fi
    else
        log_warning "No DATABASE_URL found, skipping database wait"
    fi
}

# Function to run database migrations
run_migrations() {
    log_info "Running database migrations..."

    if [ -f "/app/prisma/schema.prisma" ]; then
        cd /app

        # Generate Prisma client if needed
        if [ ! -d "/app/node_modules/.prisma" ]; then
            log_info "Generating Prisma client..."
            bun run db:generate
        fi

        # Run migrations
        log_info "Pushing database schema..."
        bun run db:push

        # Check if we should seed the database
        if [ "$SEED_DATABASE" = "true" ] || [ "$NODE_ENV" = "development" ]; then
            if [ -f "/app/prisma/seed.ts" ]; then
                log_info "Seeding database..."
                bun run db:seed
            fi
        fi

        log_success "Database migrations completed!"
    else
        log_warning "No Prisma schema found, skipping migrations"
    fi
}

# Function to verify required environment variables
verify_env() {
    log_info "Verifying environment variables..."

    # Required variables
    REQUIRED_VARS="JWT_SECRET"

    for var in $REQUIRED_VARS; do
        eval value=\$$var
        if [ -z "$value" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Optional but recommended variables
    RECOMMENDED_VARS="DATABASE_URL REDIS_URL"

    for var in $RECOMMENDED_VARS; do
        eval value=\$$var
        if [ -z "$value" ]; then
            log_warning "Recommended environment variable $var is not set"
        fi
    done

    log_success "Environment verification completed!"
}

# Function to prepare application directories
prepare_directories() {
    log_info "Preparing application directories..."

    # Create required directories
    mkdir -p /app/logs
    mkdir -p /app/uploads
    mkdir -p /app/tmp

    # Set permissions
    chmod 755 /app/logs
    chmod 755 /app/uploads
    chmod 755 /app/tmp

    log_success "Application directories ready!"
}

# Function to check health endpoints
health_check() {
    log_info "Running initial health check..."

    # Wait a bit for the server to start
    sleep 5

    # Check if health endpoint is responding
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Health check passed!"
    else
        log_warning "Health check failed, but continuing startup"
    fi
}

# Function to handle graceful shutdown
cleanup() {
    log_info "Received shutdown signal, performing cleanup..."

    # Kill any background processes
    if [ -n "$SERVER_PID" ]; then
        log_info "Stopping server (PID: $SERVER_PID)..."
        kill -TERM "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi

    log_success "Cleanup completed!"
    exit 0
}

# Set up signal handlers
trap cleanup TERM INT

# Main execution
main() {
    log_info "Starting DataVault Pro application..."
    log_info "Node Environment: ${NODE_ENV:-production}"
    log_info "Application Version: ${COMMIT_SHA:-unknown}"

    # Run startup checks
    verify_env
    prepare_directories
    wait_for_db
    run_migrations

    # Start the application
    log_info "Starting Next.js server..."

    if [ "$NODE_ENV" = "development" ]; then
        log_info "Running in development mode"
        bun run dev &
    else
        log_info "Running in production mode"
        node server.js &
    fi

    SERVER_PID=$!
    log_success "Server started with PID: $SERVER_PID"

    # Run health check in background
    health_check &

    # Wait for the server process
    wait "$SERVER_PID"
}

# Execute main function
main "$@"
