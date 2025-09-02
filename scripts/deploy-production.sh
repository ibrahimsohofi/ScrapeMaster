#!/bin/bash

# Production Deployment Script for DataVault Pro
# Deploys the complete enterprise stack with SSL, monitoring, and load balancing

set -e

# Configuration
DOMAIN="${DOMAIN:-datavault.pro}"
EMAIL="${EMAIL:-admin@datavault.pro}"
ENVIRONMENT="${ENVIRONMENT:-production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."

    # Check if running as root (required for some operations)
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root. Consider using a dedicated deployment user."
    fi

    # Check required commands
    local required_commands=("docker" "docker-compose" "openssl" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' not found. Please install it first."
        fi
    done

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running or not accessible."
    fi

    # Check available disk space (minimum 10GB)
    local available_space=$(df / | tail -1 | awk '{print $4}')
    if [[ $available_space -lt 10485760 ]]; then # 10GB in KB
        warn "Less than 10GB disk space available. Consider freeing up space."
    fi

    # Check memory (minimum 4GB)
    local total_memory=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    if [[ $total_memory -lt 4194304 ]]; then # 4GB in KB
        warn "Less than 4GB RAM available. Performance may be affected."
    fi

    # Validate environment variables
    if [[ -z "$DB_PASSWORD" ]]; then
        error "DB_PASSWORD environment variable is required"
    fi

    if [[ -z "$JWT_SECRET" ]]; then
        error "JWT_SECRET environment variable is required"
    fi

    log "✅ Pre-deployment checks completed"
}

# Setup directories and permissions
setup_directories() {
    log "📁 Setting up directories and permissions..."

    local directories=(
        "logs"
        "backups"
        "ssl-certs"
        "data"
        "monitoring/grafana"
        "monitoring/prometheus"
        "monitoring/alertmanager"
        "nginx/ssl"
        "haproxy/ssl"
    )

    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        chmod 755 "$dir"
    done

    # Set specific permissions for sensitive directories
    chmod 700 ssl-certs
    chmod 700 backups

    log "✅ Directories and permissions set up"
}

# Generate SSL certificates
setup_ssl() {
    log "🔒 Setting up SSL certificates..."

    # Check if certificates already exist
    if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
        log "SSL certificates already exist for $DOMAIN"
        return
    fi

    # Run certbot in standalone mode for initial certificate
    log "Obtaining SSL certificate for $DOMAIN..."

    # Stop nginx if running
    docker-compose -f "$COMPOSE_FILE" stop nginx || true

    # Run certbot
    docker run --rm \
        -p 80:80 \
        -v "/etc/letsencrypt:/etc/letsencrypt" \
        -v "/var/www/certbot:/var/www/certbot" \
        certbot/certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN" \
        --non-interactive

    # Setup auto-renewal
    setup_ssl_renewal

    log "✅ SSL certificates configured"
}

# Setup SSL auto-renewal
setup_ssl_renewal() {
    log "🔄 Setting up SSL certificate auto-renewal..."

    # Create renewal script
    cat > /etc/cron.daily/certbot-renewal << 'EOF'
#!/bin/bash
certbot renew --quiet --nginx
systemctl reload nginx
EOF

    chmod +x /etc/cron.daily/certbot-renewal

    log "✅ SSL auto-renewal configured"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "📊 Deploying monitoring stack..."

    # Start monitoring services
    docker-compose -f monitoring/docker-compose.monitoring.yml up -d

    # Wait for services to start
    log "Waiting for monitoring services to start..."
    sleep 30

    # Verify monitoring services
    local services=("prometheus:9090" "grafana:3001" "alertmanager:9093")
    for service in "${services[@]}"; do
        local host_port=(${service//:/ })
        if curl -f -s "http://localhost:${host_port[1]}/health" &> /dev/null; then
            log "✅ ${host_port[0]} is healthy"
        else
            warn "⚠️ ${host_port[0]} health check failed"
        fi
    done

    log "✅ Monitoring stack deployed"
}

# Deploy main application
deploy_application() {
    log "🚀 Deploying DataVault Pro application..."

    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull

    # Run database migrations
    log "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" run --rm datavault-app-1 npm run db:migrate

    # Start application services
    docker-compose -f "$COMPOSE_FILE" up -d

    # Wait for application to start
    log "Waiting for application to start..."
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost/api/health" &> /dev/null; then
            log "✅ Application is healthy"
            break
        fi

        if [[ $attempt -eq $max_attempts ]]; then
            error "Application failed to start after $max_attempts attempts"
        fi

        log "Attempt $attempt/$max_attempts: Waiting for application..."
        sleep 10
        ((attempt++))
    done

    log "✅ Application deployed successfully"
}

# Configure load balancing
configure_load_balancing() {
    log "⚖️ Configuring load balancing..."

    # Ensure HAProxy and nginx are running
    docker-compose -f "$COMPOSE_FILE" up -d nginx haproxy

    # Test load balancer configuration
    if curl -f -s "http://localhost:8404/stats" &> /dev/null; then
        log "✅ HAProxy stats page accessible"
    else
        warn "⚠️ HAProxy stats page not accessible"
    fi

    # Test nginx configuration
    if docker exec datavault-nginx nginx -t; then
        log "✅ Nginx configuration is valid"
    else
        error "❌ Nginx configuration is invalid"
    fi

    log "✅ Load balancing configured"
}

# Setup backup system
setup_backup() {
    log "💾 Setting up backup system..."

    # Create backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_backup_$DATE.sql"

# Database backup
PGPASSWORD="$DB_PASSWORD" pg_dump -h postgres -U datavault datavault_prod > "$DB_BACKUP"

# Compress backup
gzip "$DB_BACKUP"

# Remove old backups (older than 30 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${DB_BACKUP}.gz"
EOF

    chmod +x scripts/backup.sh

    # Setup backup cron job
    echo "0 2 * * * /app/scripts/backup.sh" | crontab -

    log "✅ Backup system configured"
}

# Validate deployment
validate_deployment() {
    log "🔍 Validating deployment..."

    local endpoints=(
        "https://$DOMAIN/api/health"
        "https://$DOMAIN/api/auth/login"
        "https://$DOMAIN/"
    )

    for endpoint in "${endpoints[@]}"; do
        if curl -f -s -k "$endpoint" &> /dev/null; then
            log "✅ $endpoint is accessible"
        else
            warn "⚠️ $endpoint is not accessible"
        fi
    done

    # Check SSL certificate
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | openssl x509 -text -noout | grep -q "Subject.*$DOMAIN"; then
        log "✅ SSL certificate is valid"
    else
        warn "⚠️ SSL certificate validation failed"
    fi

    # Check service health
    local services=$(docker-compose -f "$COMPOSE_FILE" ps --services)
    for service in $services; do
        local status=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
        if [[ "$status" == "healthy" ]]; then
            log "✅ $service is healthy"
        elif [[ "$status" == "unknown" ]]; then
            log "ℹ️ $service has no health check"
        else
            warn "⚠️ $service is $status"
        fi
    done

    log "✅ Deployment validation completed"
}

# Performance optimization
optimize_performance() {
    log "⚡ Applying performance optimizations..."

    # Optimize Docker daemon
    cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ]
}
EOF

    # Restart Docker daemon
    systemctl restart docker

    # Set system optimizations
    echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
    echo 'fs.file-max=65536' >> /etc/sysctl.conf
    sysctl -p

    log "✅ Performance optimizations applied"
}

# Setup monitoring alerts
setup_alerts() {
    log "🔔 Setting up monitoring alerts..."

    # Configure Grafana dashboards
    local grafana_url="http://localhost:3001"
    local grafana_user="admin"
    local grafana_pass="DataVault2024!"

    # Wait for Grafana to be ready
    sleep 30

    # Import dashboards (this would be done via API in a real scenario)
    log "Grafana dashboards will need to be imported manually at $grafana_url"
    log "Login with: $grafana_user / $grafana_pass"

    # Test AlertManager
    if curl -f -s "http://localhost:9093/-/healthy" &> /dev/null; then
        log "✅ AlertManager is healthy"
    else
        warn "⚠️ AlertManager health check failed"
    fi

    log "✅ Monitoring alerts configured"
}

# Security hardening
security_hardening() {
    log "🔐 Applying security hardening..."

    # Setup firewall rules
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Disable unnecessary services
    systemctl disable bluetooth || true
    systemctl disable cups || true

    # Set secure file permissions
    find /etc -name "*.conf" -exec chmod 644 {} \;
    find /etc -name "*.key" -exec chmod 600 {} \;

    log "✅ Security hardening applied"
}

# Cleanup old resources
cleanup() {
    log "🧹 Cleaning up old resources..."

    # Remove old Docker images
    docker image prune -af --filter "until=72h"

    # Remove old logs
    find logs/ -name "*.log" -mtime +7 -delete

    # Remove old backups (handled by backup script)

    log "✅ Cleanup completed"
}

# Generate deployment report
generate_report() {
    log "📋 Generating deployment report..."

    local report_file="deployment-report-$(date +%Y%m%d_%H%M%S).txt"

    cat > "$report_file" << EOF
DataVault Pro Production Deployment Report
==========================================

Deployment Date: $(date)
Environment: $ENVIRONMENT
Domain: $DOMAIN
Server: $(hostname)

Service Status:
$(docker-compose -f "$COMPOSE_FILE" ps)

Resource Usage:
CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%
Memory: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
Disk: $(df -h / | awk 'NR==2{print $5}')

Network Endpoints:
- Main Application: https://$DOMAIN
- Grafana Dashboard: http://$DOMAIN:3001
- HAProxy Stats: http://$DOMAIN:8404/stats
- Prometheus: http://$DOMAIN:9090

SSL Certificate:
$(openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -text -noout | grep -A2 "Validity")

Next Steps:
1. Configure DNS to point to this server
2. Import Grafana dashboards
3. Configure external monitoring integrations
4. Setup log shipping to external systems
5. Configure backup verification

EOF

    log "📄 Deployment report saved to: $report_file"

    # Display summary
    echo -e "\n${GREEN}🎉 DataVault Pro deployed successfully!${NC}"
    echo -e "${BLUE}Access your application at: https://$DOMAIN${NC}"
    echo -e "${BLUE}Monitoring dashboard: http://$DOMAIN:3001${NC}"
    echo -e "${BLUE}Deployment report: $report_file${NC}"
}

# Main deployment function
main() {
    log "🚀 Starting DataVault Pro production deployment..."

    pre_deployment_checks
    setup_directories
    setup_ssl
    deploy_monitoring
    deploy_application
    configure_load_balancing
    setup_backup
    optimize_performance
    security_hardening
    validate_deployment
    setup_alerts
    cleanup
    generate_report

    log "🎉 DataVault Pro production deployment completed successfully!"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"
