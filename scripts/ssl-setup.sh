#!/bin/bash

# SSL Certificate Automation Script for DataVault Pro
# This script sets up automated SSL certificates using Let's Encrypt

set -e

# Configuration
DOMAIN="${DOMAIN:-datavault.pro}"
EMAIL="${EMAIL:-admin@datavault.pro}"
WEBROOT="${WEBROOT:-/var/www/html}"
NGINX_CONFIG="/etc/nginx/sites-available/datavault"

echo "🔒 Setting up SSL certificates for DataVault Pro"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

# Install certbot if not present
install_certbot() {
    echo "📦 Installing certbot..."
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum >/dev/null 2>&1; then
        yum install -y certbot python3-certbot-nginx
    elif command -v brew >/dev/null 2>&1; then
        brew install certbot
    else
        echo "❌ Package manager not found. Please install certbot manually."
        exit 1
    fi
}

# Create nginx configuration
create_nginx_config() {
    echo "⚙️ Creating nginx configuration..."

    cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration will be added by certbot

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
}
EOF

    # Enable the site
    ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
}

# Obtain SSL certificate
obtain_certificate() {
    echo "🔐 Obtaining SSL certificate..."

    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN" \
        --non-interactive

    # Configure nginx with SSL
    certbot install \
        --nginx \
        --domains "$DOMAIN,www.$DOMAIN" \
        --non-interactive
}

# Set up auto-renewal
setup_renewal() {
    echo "🔄 Setting up automatic renewal..."

    # Create renewal hook script
    cat > /etc/letsencrypt/renewal-hooks/deploy/datavault-reload.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
systemctl restart datavault-pro
# Send notification
curl -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"text": "SSL certificate renewed for DataVault Pro"}'
EOF

    chmod +x /etc/letsencrypt/renewal-hooks/deploy/datavault-reload.sh

    # Test renewal
    certbot renew --dry-run

    echo "✅ Auto-renewal configured successfully"
}

# Main execution
main() {
    if [[ $EUID -ne 0 ]]; then
        echo "❌ This script must be run as root"
        exit 1
    fi

    install_certbot
    create_nginx_config
    obtain_certificate
    setup_renewal

    echo "🎉 SSL setup completed successfully!"
    echo "Your DataVault Pro instance is now secured with HTTPS"
    echo "Certificate will auto-renew every 60 days"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
