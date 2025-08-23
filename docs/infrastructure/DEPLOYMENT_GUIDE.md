# DataVault Pro - Infrastructure & CI/CD Deployment Guide

This guide covers the complete CI/CD pipeline and infrastructure setup for DataVault Pro, including Terraform infrastructure as code, GitHub Actions workflows, and external monitoring integrations.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment Process](#deployment-process)
- [Security & Compliance](#security--compliance)
- [Troubleshooting](#troubleshooting)

## 🏗️ Overview

### Architecture Components

1. **Infrastructure as Code (Terraform)**
   - AWS EKS cluster with auto-scaling node groups
   - RDS PostgreSQL with automated backups
   - ElastiCache Redis for session management
   - Application Load Balancer with SSL termination
   - VPC with public/private subnets across AZs

2. **CI/CD Pipeline (GitHub Actions)**
   - Automated testing (unit, integration, performance)
   - Security scanning and vulnerability assessment
   - Multi-stage deployments (staging → production)
   - Blue/green deployment strategy
   - Automated rollback capabilities

3. **Monitoring & Observability**
   - DataDog integration for APM and infrastructure monitoring
   - New Relic for application performance monitoring
   - Prometheus + Grafana for custom metrics
   - Centralized logging with structured log aggregation

4. **Security & Compliance**
   - Container image scanning with Trivy
   - SAST/DAST security testing
   - Secrets management with AWS Secrets Manager
   - Network policies and security groups
   - RBAC for Kubernetes access

## 🔧 Prerequisites

### Required Tools

```bash
# Install required CLI tools
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip && sudo mv terraform /usr/local/bin/

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar xz
sudo mv linux-amd64/helm /usr/local/bin/

# GitHub CLI (optional, for secrets management)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list
sudo apt update && sudo apt install gh
```

### AWS Account Setup

1. **Create IAM User** with programmatic access
2. **Attach Required Policies:**
   - `AdministratorAccess` (for full deployment)
   - Or create custom policy with specific permissions:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "ec2:*",
             "eks:*",
             "rds:*",
             "elasticache:*",
             "iam:*",
             "s3:*",
             "cloudformation:*",
             "logs:*",
             "route53:*",
             "acm:*"
           ],
           "Resource": "*"
         }
       ]
     }
     ```

3. **Create S3 Bucket** for Terraform state:
   ```bash
   aws s3 mb s3://datavault-pro-terraform-state-$(openssl rand -hex 4)
   aws s3api put-bucket-versioning --bucket datavault-pro-terraform-state-XXXX --versioning-configuration Status=Enabled
   ```

### Environment Variables

Create `.env` file for local development:

```bash
# AWS Configuration
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-west-2"
export TF_STATE_BUCKET="datavault-pro-terraform-state-XXXX"

# Application Configuration
export DATABASE_URL="postgresql://username:password@localhost:5432/datavault_pro"
export JWT_SECRET="your-super-secret-jwt-key"
export REDIS_URL="redis://localhost:6379"

# Optional - Monitoring
export DATADOG_API_KEY="your-datadog-api-key"
export NEWRELIC_LICENSE_KEY="your-newrelic-license-key"

# Optional - Notifications
export SLACK_WEBHOOK_URL="your-slack-webhook-url"

# GitHub Repository (for container registry)
export GITHUB_REPOSITORY="yourusername/datavault-pro"
```

## 🚀 Infrastructure Setup

### 1. Initialize Terraform Backend

```bash
cd infrastructure/terraform

# Initialize with remote backend
terraform init \
  -backend-config="bucket=${TF_STATE_BUCKET}" \
  -backend-config="key=staging/terraform.tfstate" \
  -backend-config="region=${AWS_REGION}"
```

### 2. Plan Infrastructure

```bash
# Plan staging environment
terraform plan -var-file="environments/staging.tfvars" -out=staging.tfplan

# Plan production environment
terraform plan -var-file="environments/production.tfvars" -out=production.tfplan
```

### 3. Deploy Infrastructure

```bash
# Deploy staging
terraform apply staging.tfplan

# Deploy production (requires manual approval)
terraform apply production.tfplan
```

### 4. Configure kubectl

```bash
# Update kubeconfig for the new cluster
aws eks update-kubeconfig --region ${AWS_REGION} --name datavault-pro-staging-cluster
```

### 5. Install Cluster Components

Use the automated deployment script:

```bash
# Deploy to staging
./scripts/deploy-infrastructure.sh staging

# Deploy to production
./scripts/deploy-infrastructure.sh production
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Stages:**
1. **Security & Code Quality**
   - TypeScript compilation
   - ESLint and Biome formatting
   - Security audit with `bun audit`
   - SonarCloud static analysis
   - Dependency vulnerability scanning

2. **Testing**
   - Unit tests with coverage reporting
   - Integration tests against test database
   - Performance tests with K6
   - End-to-end tests

3. **Build & Containerization**
   - Multi-platform Docker builds (AMD64, ARM64)
   - Container image scanning with Trivy
   - SBOM generation
   - Push to GitHub Container Registry and AWS ECR

#### 2. CD Pipeline (`.github/workflows/cd.yml`)

**Triggers:**
- Successful CI pipeline completion on `main` branch
- Manual workflow dispatch
- Git tags (for production releases)

**Stages:**
1. **Staging Deployment**
   - Terraform plan and apply
   - Blue/green Kubernetes deployment
   - Smoke tests and health checks
   - DataDog/New Relic deployment markers

2. **Integration Testing**
   - Full integration test suite against staging
   - Performance benchmarking
   - Security validation

3. **Production Deployment** (requires manual approval)
   - Database backup creation
   - Blue/green production deployment
   - Traffic switching with zero downtime
   - Post-deployment verification

### Environment Configuration

#### GitHub Secrets

Set up the following secrets in your GitHub repository:

```bash
# Using GitHub CLI
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"
gh secret set AWS_REGION --body "$AWS_REGION"
gh secret set TF_STATE_BUCKET --body "$TF_STATE_BUCKET"
gh secret set DATADOG_API_KEY --body "$DATADOG_API_KEY"
gh secret set NEW_RELIC_LICENSE_KEY --body "$NEWRELIC_LICENSE_KEY"
gh secret set SLACK_WEBHOOK_URL --body "$SLACK_WEBHOOK_URL"

# Database credentials
gh secret set STAGING_DATABASE_URL --body "$STAGING_DATABASE_URL"
gh secret set PRODUCTION_DATABASE_URL --body "$PRODUCTION_DATABASE_URL"

# API keys for testing
gh secret set STAGING_API_KEY --body "$STAGING_API_KEY"
gh secret set PRODUCTION_API_KEY --body "$PRODUCTION_API_KEY"
```

#### Environment Protection Rules

Configure environment protection rules in GitHub:

1. **Staging Environment:**
   - No protection rules (automatic deployment)
   - Required status checks from CI pipeline

2. **Production Environment:**
   - Required reviewers (minimum 1)
   - Required status checks
   - Deployment branches: `main` only
   - Restrict pushes to protected branches

## 📊 Monitoring & Observability

### DataDog Integration

**Features:**
- Application Performance Monitoring (APM)
- Infrastructure monitoring
- Log aggregation and analysis
- Custom metrics and alerts
- Deployment tracking

**Configuration:**
```yaml
# Automatic installation via Helm
helm upgrade --install datadog datadog/datadog \
  --set datadog.apiKey="$DATADOG_API_KEY" \
  --set datadog.site="datadoghq.com" \
  --set datadog.logs.enabled=true \
  --set datadog.apm.enabled=true
```

**Custom Metrics:**
- `datavault_scraping_jobs_total`
- `datavault_scraping_success_rate`
- `datavault_scraping_duration_seconds`
- `datavault_proxy_health_score`
- `datavault_captcha_solve_rate`
- `datavault_active_users`
- `datavault_billing_usage`

### New Relic Integration

**Features:**
- Full-stack observability
- Real User Monitoring (RUM)
- Infrastructure monitoring
- Error tracking and alerting

**Installation:**
```bash
# Applied via Kubernetes manifests
kubectl apply -f infrastructure/monitoring/newrelic-integration.yaml
```

### Prometheus & Grafana

**Custom Dashboards:**
1. Application Performance Dashboard
2. Infrastructure Health Dashboard
3. Business Metrics Dashboard
4. Security Monitoring Dashboard

**Alert Rules:**
- High error rate (>5%)
- Response time degradation (>2s p95)
- Resource utilization (>80% CPU/Memory)
- Failed scraping jobs
- Security incidents

## 🚀 Deployment Process

### Automated Deployment Flow

1. **Developer pushes code** to feature branch
2. **CI pipeline runs** automatically:
   - Code quality checks
   - Unit and integration tests
   - Security scanning
   - Build and containerize

3. **Pull Request created** to `main` branch:
   - CI pipeline runs again
   - Code review required
   - Automated tests must pass

4. **Merge to main** triggers CD pipeline:
   - Deploy to staging automatically
   - Run integration tests
   - Wait for manual approval for production

5. **Production deployment:**
   - Create database backup
   - Deploy with blue/green strategy
   - Switch traffic gradually
   - Monitor and verify

### Manual Deployment Commands

```bash
# Deploy specific version to staging
git tag v1.2.3
git push origin v1.2.3

# Manual infrastructure update
cd infrastructure/terraform
terraform plan -var-file="environments/production.tfvars"
terraform apply

# Manual application deployment
kubectl set image deployment/datavault-pro-app \
  datavault-pro=ghcr.io/yourusername/datavault-pro:v1.2.3 \
  -n datavault-production

# Check rollout status
kubectl rollout status deployment/datavault-pro-app -n datavault-production
```

### Rollback Procedures

```bash
# Automatic rollback (built into CD pipeline)
# Manual rollback
kubectl rollout undo deployment/datavault-pro-app -n datavault-production

# Rollback to specific revision
kubectl rollout undo deployment/datavault-pro-app --to-revision=2 -n datavault-production

# Database rollback (if needed)
# Restore from automated backup
aws rds restore-db-instance-from-db-snapshot \
  --source-db-snapshot-identifier datavault-pro-backup-TIMESTAMP \
  --db-instance-identifier datavault-pro-restored
```

## 🔒 Security & Compliance

### Container Security

1. **Base Image Scanning:**
   - Multi-stage builds with minimal base images
   - Regular base image updates
   - Trivy vulnerability scanning

2. **Runtime Security:**
   - Non-root user execution
   - Read-only root filesystem
   - Security contexts and policies

3. **Network Security:**
   - Network policies for pod-to-pod communication
   - Service mesh (optional with Istio)
   - WAF integration with ALB

### Secrets Management

1. **Kubernetes Secrets:**
   ```bash
   # Create application secrets
   kubectl create secret generic app-secrets \
     --from-literal=database-url="$DATABASE_URL" \
     --from-literal=jwt-secret="$JWT_SECRET" \
     --from-literal=redis-url="$REDIS_URL" \
     -n datavault-production
   ```

2. **AWS Secrets Manager Integration:**
   ```bash
   # Install External Secrets Operator
   helm repo add external-secrets https://charts.external-secrets.io
   helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
   ```

### Compliance Features

- **GDPR Compliance:** Data retention policies, right to deletion
- **SOC 2 Type II:** Audit logging, access controls
- **ISO 27001:** Security management system
- **HIPAA Ready:** Encryption at rest and in transit

## 🔧 Troubleshooting

### Common Issues

#### 1. EKS Cluster Access Issues

```bash
# Check AWS credentials
aws sts get-caller-identity

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name datavault-pro-staging-cluster

# Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces
```

#### 2. Database Connection Issues

```bash
# Check RDS connectivity
aws rds describe-db-instances --db-instance-identifier datavault-pro-staging-db

# Test connection from pod
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql postgresql://username:password@endpoint:5432/datavault_pro
```

#### 3. Application Deployment Issues

```bash
# Check deployment status
kubectl describe deployment datavault-pro-app -n datavault-staging

# Check pod logs
kubectl logs -f deployment/datavault-pro-app -n datavault-staging

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp -n datavault-staging
```

#### 4. CI/CD Pipeline Issues

```bash
# Check GitHub Actions logs
gh run list --repo yourusername/datavault-pro
gh run view [run-id] --log

# Re-run failed workflow
gh run rerun [run-id]
```

### Performance Optimization

1. **Cluster Autoscaling:**
   ```bash
   # Check autoscaler status
   kubectl logs -f deployment/cluster-autoscaler -n kube-system
   ```

2. **Horizontal Pod Autoscaling:**
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: datavault-pro-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: datavault-pro-app
     minReplicas: 3
     maxReplicas: 50
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
   ```

3. **Database Performance:**
   ```sql
   -- Monitor slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

### Monitoring & Alerting Setup

1. **Critical Alerts:**
   - Application down
   - Database connectivity issues
   - High error rates
   - Security incidents

2. **Warning Alerts:**
   - High response times
   - Resource utilization
   - Failed deployments
   - Certificate expiration

3. **Info Alerts:**
   - Successful deployments
   - Scaling events
   - Backup completion

---

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [DataDog Kubernetes Integration](https://docs.datadoghq.com/integrations/kubernetes/)
- [New Relic Kubernetes Monitoring](https://docs.newrelic.com/docs/kubernetes-pixie/kubernetes-integration/get-started/introduction-kubernetes-integration/)

For support or questions, please contact the DevOps team or create an issue in the repository.
