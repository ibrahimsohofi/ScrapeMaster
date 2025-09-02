#!/bin/bash

# SSL Certificate Monitoring Script for DataVault Pro
# Monitors SSL certificate expiration and sends alerts

set -e

# Configuration
DOMAIN="${DOMAIN:-datavault.pro}"
ALERT_DAYS="${ALERT_DAYS:-30}"
WEBHOOK_URL="${WEBHOOK_URL:-}"
EMAIL_TO="${EMAIL_TO:-admin@datavault.pro}"
LOG_FILE="/var/log/datavault/ssl-monitor.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Check certificate expiration
check_certificate() {
    local domain="$1"
    local alert_days="$2"

    log "🔍 Checking SSL certificate for $domain"

    # Get certificate expiration date
    local expiry_date
    expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                 openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [[ -z "$expiry_date" ]]; then
        log "❌ Failed to retrieve certificate for $domain"
        send_alert "SSL Certificate Check Failed" "Failed to retrieve SSL certificate for $domain"
        return 1
    fi

    # Convert to epoch time
    local expiry_epoch
    expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch
    current_epoch=$(date +%s)
    local days_until_expiry
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

    log "📅 Certificate expires in $days_until_expiry days ($expiry_date)"

    # Check if certificate is expiring soon
    if [[ $days_until_expiry -le $alert_days ]]; then
        if [[ $days_until_expiry -le 0 ]]; then
            log "🚨 CRITICAL: Certificate for $domain has EXPIRED!"
            send_alert "SSL Certificate EXPIRED" "SSL certificate for $domain has expired on $expiry_date"
        else
            log "⚠️ WARNING: Certificate for $domain expires in $days_until_expiry days"
            send_alert "SSL Certificate Expiring Soon" "SSL certificate for $domain expires in $days_until_expiry days ($expiry_date)"
        fi
        return 1
    else
        log "✅ Certificate for $domain is valid (expires in $days_until_expiry days)"
        return 0
    fi
}

# Send alert via webhook
send_webhook_alert() {
    local title="$1"
    local message="$2"

    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d '{
                "text": "'"$title"'",
                "attachments": [{
                    "color": "danger",
                    "fields": [{
                        "title": "SSL Certificate Alert",
                        "value": "'"$message"'",
                        "short": false
                    }]
                }]
            }' \
            --silent --fail || log "❌ Failed to send webhook alert"
    fi
}

# Send email alert
send_email_alert() {
    local title="$1"
    local message="$2"

    if command -v mail >/dev/null 2>&1 && [[ -n "$EMAIL_TO" ]]; then
        echo "$message" | mail -s "$title - DataVault Pro" "$EMAIL_TO" || \
            log "❌ Failed to send email alert"
    fi
}

# Send alert (webhook + email)
send_alert() {
    local title="$1"
    local message="$2"

    log "📧 Sending alert: $title"
    send_webhook_alert "$title" "$message"
    send_email_alert "$title" "$message"
}

# Check certificate chain
check_certificate_chain() {
    local domain="$1"

    log "🔗 Checking certificate chain for $domain"

    # Check if certificate chain is complete
    local chain_result
    chain_result=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" -verify_return_error 2>&1)

    if echo "$chain_result" | grep -q "Verify return code: 0"; then
        log "✅ Certificate chain is valid"
        return 0
    else
        log "❌ Certificate chain is invalid"
        send_alert "SSL Certificate Chain Invalid" "SSL certificate chain for $domain is invalid or incomplete"
        return 1
    fi
}

# Check SSL configuration security
check_ssl_security() {
    local domain="$1"

    log "🔒 Checking SSL security configuration for $domain"

    # Check SSL/TLS version
    local ssl_info
    ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
              grep -E "(Protocol|Cipher)")

    log "SSL Info: $ssl_info"

    # Check for weak protocols (should not allow SSLv3, TLSv1.0, TLSv1.1)
    if echo "$ssl_info" | grep -qE "(SSLv3|TLSv1\.0|TLSv1\.1)"; then
        log "⚠️ WARNING: Weak SSL/TLS protocol detected"
        send_alert "Weak SSL Protocol" "Weak SSL/TLS protocol detected for $domain: $ssl_info"
    fi

    # Check for strong ciphers
    if echo "$ssl_info" | grep -qE "(AES256|ECDHE)"; then
        log "✅ Strong cipher suite detected"
    else
        log "⚠️ WARNING: Weak cipher suite detected"
        send_alert "Weak SSL Cipher" "Weak SSL cipher detected for $domain: $ssl_info"
    fi
}

# Generate SSL health report
generate_health_report() {
    local report_file="/var/log/datavault/ssl-health-report.json"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    log "📊 Generating SSL health report"

    # Get certificate details
    local cert_info
    cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
               openssl x509 -noout -text 2>/dev/null)

    # Extract key information
    local issuer
    issuer=$(echo "$cert_info" | grep "Issuer:" | sed 's/.*Issuer: //')
    local subject
    subject=$(echo "$cert_info" | grep "Subject:" | sed 's/.*Subject: //')
    local not_before
    not_before=$(echo "$cert_info" | grep "Not Before:" | sed 's/.*Not Before: //')
    local not_after
    not_after=$(echo "$cert_info" | grep "Not After :" | sed 's/.*Not After : //')

    # Create JSON report
    cat > "$report_file" << EOF
{
    "timestamp": "$timestamp",
    "domain": "$DOMAIN",
    "certificate": {
        "issuer": "$issuer",
        "subject": "$subject",
        "not_before": "$not_before",
        "not_after": "$not_after"
    },
    "checks": {
        "expiration_check": $(check_certificate "$DOMAIN" "$ALERT_DAYS" >/dev/null 2>&1 && echo "true" || echo "false"),
        "chain_check": $(check_certificate_chain "$DOMAIN" >/dev/null 2>&1 && echo "true" || echo "false")
    }
}
EOF

    log "📋 SSL health report saved to $report_file"
}

# Main monitoring function
main() {
    log "🚀 Starting SSL certificate monitoring for DataVault Pro"

    # Check certificate expiration
    check_certificate "$DOMAIN" "$ALERT_DAYS"

    # Check certificate chain
    check_certificate_chain "$DOMAIN"

    # Check SSL security configuration
    check_ssl_security "$DOMAIN"

    # Generate health report
    generate_health_report

    log "✅ SSL monitoring completed"
}

# Handle command line options
case "${1:-}" in
    "check")
        check_certificate "$DOMAIN" "$ALERT_DAYS"
        ;;
    "chain")
        check_certificate_chain "$DOMAIN"
        ;;
    "security")
        check_ssl_security "$DOMAIN"
        ;;
    "report")
        generate_health_report
        ;;
    *)
        main
        ;;
esac
