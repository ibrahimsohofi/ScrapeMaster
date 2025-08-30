#!/bin/bash
# =============================================================================
# DataVault Pro CI/CD Setup Validation Script
# Comprehensive validation of enterprise CI/CD configuration
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

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✅ PASS]${NC} $1"
    ((PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[⚠️  WARN]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[❌ FAIL]${NC} $1"
    ((FAILED++))
}

log_header() {
    echo
    echo -e "${CYAN}================================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}================================================${NC}"
}

# Test functions
test_file_exists() {
    local file="$1"
    local description="$2"

    if [ -f "$file" ]; then
        log_success "$description: $file exists"
        return 0
    else
        log_error "$description: $file not found"
        return 1
    fi
}

test_directory_exists() {
    local dir="$1"
    local description="$2"

    if [ -d "$dir" ]; then
        log_success "$description: $dir exists"
        return 0
    else
        log_error "$description: $dir not found"
        return 1
    fi
}

test_file_executable() {
    local file="$1"
    local description="$2"

    if [ -x "$file" ]; then
        log_success "$description: $file is executable"
        return 0
    else
        log_error "$description: $file is not executable"
        return 1
    fi
}

test_yaml_syntax() {
    local file="$1"
    local description="$2"

    if command -v yq &> /dev/null; then
        if yq eval . "$file" > /dev/null 2>&1; then
            log_success "$description: $file has valid YAML syntax"
            return 0
        else
            log_error "$description: $file has invalid YAML syntax"
            return 1
        fi
    else
        log_warning "$description: Cannot validate YAML (yq not available)"
        return 0
    fi
}

test_json_syntax() {
    local file="$1"
    local description="$2"

    if command -v jq &> /dev/null; then
        if jq . "$file" > /dev/null 2>&1; then
            log_success "$description: $file has valid JSON syntax"
            return 0
        else
            log_error "$description: $file has invalid JSON syntax"
            return 1
        fi
    else
        log_warning "$description: Cannot validate JSON (jq not available)"
        return 0
    fi
}

test_env_file() {
    local file="$1"
    local description="$2"

    if [ -f "$file" ]; then
        log_success "$description: $file exists"

        # Check for required variables
        local required_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" "$file"; then
                log_success "  - $var is defined"
            else
                log_warning "  - $var is not defined in $file"
            fi
        done
        return 0
    else
        log_error "$description: $file not found"
        return 1
    fi
}

# Main validation
main() {
    log_header "🚀 DataVault Pro CI/CD Setup Validation"
    log_info "Validating enterprise CI/CD configuration..."
    echo

    # Test 1: Core Files
    log_header "📁 Core Files Validation"
    test_file_exists "package.json" "Package configuration"
    test_file_exists "next.config.js" "Next.js configuration"
    test_file_exists "tailwind.config.ts" "Tailwind configuration"
    test_file_exists "tsconfig.json" "TypeScript configuration"
    test_file_exists "biome.json" "Biome configuration"
    test_file_exists "vitest.config.ts" "Vitest configuration"
    test_file_exists "netlify.toml" "Netlify configuration"

    # Test 2: Docker Configuration
    log_header "🐳 Docker Configuration"
    test_file_exists "Dockerfile" "Production Dockerfile"
    test_file_exists "docker-entrypoint.sh" "Docker entrypoint script"
    test_file_executable "docker-entrypoint.sh" "Docker entrypoint script executable"
    test_file_exists "docker-compose.development.yml" "Development Docker Compose"
    test_file_exists "docker-compose.production.yml" "Production Docker Compose"
    test_file_exists ".dockerignore" "Docker ignore file"

    # Test 3: Environment Configuration
    log_header "🌍 Environment Configuration"
    test_env_file ".env" "Base environment file"
    test_env_file ".env.local" "Local environment file"
    test_env_file ".env.development" "Development environment file"

    # Test 4: GitHub Actions CI/CD
    log_header "⚙️ GitHub Actions CI/CD"
    test_directory_exists ".github/workflows" "GitHub workflows directory"
    test_file_exists ".github/workflows/ci.yml" "CI workflow"
    test_file_exists ".github/workflows/cd.yml" "CD workflow"
    test_yaml_syntax ".github/workflows/ci.yml" "CI workflow YAML"
    test_yaml_syntax ".github/workflows/cd.yml" "CD workflow YAML"

    # Test 5: Database Configuration
    log_header "🗄️ Database Configuration"
    test_directory_exists "prisma" "Prisma directory"
    test_file_exists "prisma/schema.prisma" "Prisma schema"
    test_file_exists "prisma/seed.ts" "Database seed file"

    # Test 6: Deployment Scripts
    log_header "🚀 Deployment Scripts"
    test_directory_exists "scripts" "Scripts directory"
    test_file_exists "scripts/deploy.sh" "Main deployment script"
    test_file_executable "scripts/deploy.sh" "Deployment script executable"
    test_file_exists "scripts/validate-setup.sh" "Validation script"

    # Test 7: Monitoring Configuration
    log_header "📊 Monitoring Configuration"
    test_directory_exists "monitoring" "Monitoring directory"
    test_directory_exists "monitoring/prometheus" "Prometheus configuration"
    test_directory_exists "monitoring/alertmanager" "AlertManager configuration"
    test_file_exists "monitoring/prometheus/prometheus.yml" "Prometheus config"
    test_file_exists "monitoring/alertmanager/alertmanager.yml" "AlertManager config"
    test_yaml_syntax "monitoring/prometheus/prometheus.yml" "Prometheus YAML"
    test_yaml_syntax "monitoring/alertmanager/alertmanager.yml" "AlertManager YAML"

    # Test 8: Infrastructure as Code
    log_header "🏗️ Infrastructure as Code"
    test_directory_exists "infrastructure" "Infrastructure directory"
    test_directory_exists "k8s" "Kubernetes manifests"
    test_file_exists "haproxy/haproxy.conf" "HAProxy configuration"
    test_file_exists "nginx/nginx.conf" "Nginx configuration"

    # Test 9: Application Structure
    log_header "🏛️ Application Structure"
    test_directory_exists "src/app" "Next.js app directory"
    test_directory_exists "src/components" "Components directory"
    test_directory_exists "src/lib" "Library directory"
    test_directory_exists "src/hooks" "Hooks directory"
    test_file_exists "src/app/layout.tsx" "Root layout"
    test_file_exists "src/app/page.tsx" "Home page"
    test_file_exists "src/middleware.ts" "Middleware"

    # Test 10: Testing Configuration
    log_header "🧪 Testing Configuration"
    test_directory_exists "tests" "Tests directory"
    test_directory_exists "tests/unit" "Unit tests"
    test_directory_exists "tests/integration" "Integration tests"
    test_directory_exists "tests/performance" "Performance tests"
    test_file_exists "tests/setup.ts" "Test setup"

    # Test 11: Package Dependencies
    log_header "📦 Package Dependencies"
    if [ -f "package.json" ]; then
        log_info "Checking package.json structure..."

        if command -v jq &> /dev/null; then
            # Check for key dependencies
            local deps=("next" "@prisma/client" "react" "typescript" "tailwindcss")
            for dep in "${deps[@]}"; do
                if jq -r '.dependencies."'$dep'"' package.json | grep -q "null"; then
                    log_warning "  - $dep not found in dependencies"
                else
                    log_success "  - $dep is present"
                fi
            done

            # Check scripts
            local scripts=("dev" "build" "start" "lint" "test")
            for script in "${scripts[@]}"; do
                if jq -r '.scripts."'$script'"' package.json | grep -q "null"; then
                    log_warning "  - $script script not defined"
                else
                    log_success "  - $script script is defined"
                fi
            done
        else
            log_warning "Cannot validate package.json (jq not available)"
        fi
    fi

    # Test 12: Security Configuration
    log_header "🔒 Security Configuration"
    if [ -f ".github/workflows/ci.yml" ]; then
        if grep -q "security-scan" ".github/workflows/ci.yml"; then
            log_success "Security scanning is configured in CI"
        else
            log_warning "Security scanning not found in CI pipeline"
        fi

        if grep -q "trivy" ".github/workflows/ci.yml"; then
            log_success "Trivy vulnerability scanning is configured"
        else
            log_warning "Trivy scanning not configured"
        fi
    fi

    # Test 13: Performance Testing
    log_header "⚡ Performance Testing"
    if [ -f "tests/performance/load-test.js" ]; then
        log_success "Load testing script exists"
        if grep -q "k6" ".github/workflows/ci.yml"; then
            log_success "K6 performance testing is configured in CI"
        else
            log_warning "K6 not configured in CI pipeline"
        fi
    else
        log_warning "Load testing script not found"
    fi

    # Final Summary
    log_header "📊 Validation Summary"
    echo
    log_info "Results Summary:"
    echo -e "  ${GREEN}✅ Passed: $PASSED${NC}"
    echo -e "  ${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
    echo -e "  ${RED}❌ Failed: $FAILED${NC}"
    echo

    if [ $FAILED -eq 0 ]; then
        log_success "🎉 All critical validations passed! CI/CD setup is ready for deployment."
        echo
        log_info "🚀 Next Steps:"
        echo "  1. Set up your environment variables with real API keys"
        echo "  2. Configure external monitoring services (DataDog, New Relic)"
        echo "  3. Set up production secrets in GitHub"
        echo "  4. Deploy to staging environment for testing"
        echo "  5. Deploy to production with blue-green strategy"
        echo
        exit 0
    else
        log_error "❌ Some validations failed. Please review and fix the issues above."
        echo
        exit 1
    fi
}

# Run main function
main "$@"
