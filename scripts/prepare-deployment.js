#!/usr/bin/env node

/**
 * ScrapeMaster Deployment Preparation Script
 * Helps prepare the application for production deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 ScrapeMaster Deployment Preparation\n');

// Generate secure secrets
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Create environment template
function createEnvTemplate() {
  const jwtSecret = generateSecret(32);
  const nextauthSecret = generateSecret(32);

  const envTemplate = `# ScrapeMaster Production Environment
# Generated on ${new Date().toISOString()}

# ===============================
# REQUIRED SETTINGS
# ===============================

# Database (REQUIRED)
# Get from: Supabase, PlanetScale, or Neon.tech
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?sslmode=require"

# Authentication (REQUIRED)
JWT_SECRET="${jwtSecret}"
NEXTAUTH_SECRET="${nextauthSecret}"

# Site Configuration (REQUIRED)
NEXTAUTH_URL="https://your-domain.com"
SITE_URL="https://your-domain.com"
SITE_NAME="DataVault Pro"

# Email Service (REQUIRED)
# SendGrid Example:
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="noreply@your-domain.com"

# ===============================
# DEPLOYMENT SETTINGS
# ===============================

NODE_ENV="production"
SKIP_ENV_VALIDATION="true"
ESLINT_NO_DEV_ERRORS="true"

# Security
BCRYPT_ROUNDS="12"
SESSION_TIMEOUT="24h"
RATE_LIMIT_WINDOW="15"
RATE_LIMIT_MAX="100"

# ===============================
# OPTIONAL SETTINGS
# ===============================

# Redis (for job queuing)
# REDIS_URL="rediss://username:password@hostname:port"

# OpenAI (for AI features)
# OPENAI_API_KEY="sk-your-openai-api-key"

# Monitoring
# SENTRY_DSN="https://your-sentry-dsn.ingest.sentry.io/project"
`;

  fs.writeFileSync('.env.production.template', envTemplate);
  console.log('✅ Created .env.production.template with secure secrets');
  console.log('📝 JWT_SECRET:', jwtSecret);
  console.log('📝 NEXTAUTH_SECRET:', nextauthSecret);
}

// Check dependencies
function checkDependencies() {
  console.log('🔍 Checking dependencies...');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  const requiredDeps = [
    '@prisma/client',
    'next',
    'react',
    'playwright',
    'jsonwebtoken',
    'bcryptjs'
  ];

  const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

  if (missing.length > 0) {
    console.log('❌ Missing dependencies:', missing.join(', '));
    return false;
  }

  console.log('✅ All required dependencies found');
  return true;
}

// Check Prisma schema
function checkPrismaSchema() {
  console.log('🔍 Checking Prisma schema...');

  if (!fileExists('prisma/schema.prisma')) {
    console.log('❌ Prisma schema not found');
    return false;
  }

  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

  if (schema.includes('provider = "sqlite"')) {
    console.log('⚠️  WARNING: Prisma schema is configured for SQLite');
    console.log('   For production, consider switching to PostgreSQL');
    console.log('   Update: provider = "postgresql" in prisma/schema.prisma');
  } else if (schema.includes('provider = "postgresql"')) {
    console.log('✅ Prisma schema configured for PostgreSQL');
  }

  return true;
}

// Check build configuration
function checkBuildConfig() {
  console.log('🔍 Checking build configuration...');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  if (!packageJson.scripts.build) {
    console.log('❌ No build script found in package.json');
    return false;
  }

  console.log('✅ Build script found');

  // Check for deployment configs
  const hasVercel = fileExists('vercel.json');
  const hasNetlify = fileExists('netlify.toml');

  if (hasVercel) console.log('✅ Vercel configuration found');
  if (hasNetlify) console.log('✅ Netlify configuration found');

  if (!hasVercel && !hasNetlify) {
    console.log('⚠️  No deployment configuration found');
    console.log('   Consider adding vercel.json or netlify.toml');
  }

  return true;
}

// Generate deployment checklist
function generateChecklist() {
  const checklist = `# 📋 Deployment Checklist

## Pre-Deployment
- [ ] Database setup (PostgreSQL recommended)
- [ ] Environment variables configured
- [ ] Email service configured (SendGrid/SMTP)
- [ ] Domain registered (optional)
- [ ] SSL certificate (auto with most platforms)

## Environment Variables Required
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL
- [ ] SITE_URL
- [ ] SMTP_* variables (for email)

## Post-Deployment Testing
- [ ] Health check: /api/health
- [ ] User registration works
- [ ] Login/logout works
- [ ] Dashboard loads
- [ ] Create test scraper
- [ ] Email notifications work

## Security
- [ ] HTTPS enabled
- [ ] Strong secrets generated
- [ ] CORS configured
- [ ] Rate limiting active

## Monitoring
- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database monitoring

Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  console.log('✅ Created DEPLOYMENT_CHECKLIST.md');
}

// Main execution
function main() {
  console.log('Starting deployment preparation...\n');

  // Check current directory
  if (!fileExists('package.json')) {
    console.log('❌ Not in project root directory. Please run from ScrapeMaster folder.');
    process.exit(1);
  }

  // Run checks
  const depsOk = checkDependencies();
  const prismaOk = checkPrismaSchema();
  const buildOk = checkBuildConfig();

  console.log('');

  // Generate files
  createEnvTemplate();
  generateChecklist();

  console.log('');

  if (depsOk && prismaOk && buildOk) {
    console.log('🎉 Deployment preparation complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Set up your database (Supabase recommended)');
    console.log('2. Copy .env.production.template and fill in your values');
    console.log('3. Push to GitHub');
    console.log('4. Deploy to Vercel/Netlify');
    console.log('5. Configure environment variables');
    console.log('6. Run database migrations');
    console.log('');
    console.log('📖 See .same/production-deployment-guide.md for detailed instructions');
  } else {
    console.log('⚠️  Please fix the issues above before deploying');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSecret, checkDependencies, checkPrismaSchema };
