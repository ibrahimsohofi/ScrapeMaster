# 🚀 ScrapeMaster Production Deployment Guide

## 🎯 **Quick Start (30 minutes to live)**

### Option A: Deploy with Vercel (Recommended)
### Option B: Deploy with Netlify
### Option C: Deploy with Railway

---

## 🔥 **Option A: Vercel Deployment (RECOMMENDED)**

### **Step 1: Database Setup (5 minutes)**

**Choose Supabase (Free tier available):**

1. Go to [supabase.com](https://supabase.com)
2. Create account and new project
3. Wait for database to initialize
4. Go to Settings > Database > Connection string
5. Copy the connection string (looks like):
   ```
   postgresql://postgres.xxx:password@aws-xxx.supabase.co:5432/postgres
   ```

### **Step 2: GitHub Repository Setup (2 minutes)**

1. Push ScrapeMaster to your GitHub account:
   ```bash
   cd ScrapeMaster
   git remote remove origin
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```

### **Step 3: Vercel Deployment (5 minutes)**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. **IMPORTANT**: Configure these settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `bun install && bun run db:generate && SKIP_ENV_VALIDATION=true ESLINT_NO_DEV_ERRORS=true bun run build`
   - **Output Directory**: `.next`
   - **Install Command**: `bun install`

### **Step 4: Environment Variables (5 minutes)**

In Vercel dashboard, go to Settings > Environment Variables and add:

```bash
# Database (REQUIRED)
DATABASE_URL=your-supabase-connection-string

# Security (REQUIRED) - Generate at: https://generate-secret.vercel.app/32
JWT_SECRET=your-32-character-secret
NEXTAUTH_SECRET=your-32-character-secret

# Site URLs (REQUIRED)
NEXTAUTH_URL=https://your-vercel-app.vercel.app
SITE_URL=https://your-vercel-app.vercel.app
SITE_NAME=DataVault Pro

# Build settings
NODE_ENV=production
SKIP_ENV_VALIDATION=true
ESLINT_NO_DEV_ERRORS=true
```

### **Step 5: Database Migration (2 minutes)**

1. In Vercel dashboard, go to Functions > View Function Logs
2. Trigger a deployment to run migrations
3. Or run manually via Supabase SQL editor:
   ```bash
   # You'll need to run Prisma migrations - see Step 6
   ```

### **Step 6: Initialize Database (5 minutes)**

**Option A: Local migration (Recommended)**
```bash
# Update your local .env with production DATABASE_URL
echo "DATABASE_URL=your-supabase-connection-string" > .env

# Run migrations
bun run db:push

# Seed initial data (optional)
bun run db:seed
```

**Option B: Supabase Dashboard**
- Copy the SQL from `prisma/schema.prisma`
- Run in Supabase SQL Editor

### **Step 7: Email Service Setup (5 minutes)**

**Option 1: SendGrid (Recommended)**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Create account (free tier: 100 emails/day)
3. Create API key
4. Add to Vercel environment variables:
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=noreply@your-domain.com
   ```

**Option 2: Gmail SMTP**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

### **Step 8: Custom Domain (Optional - 5 minutes)**

1. In Vercel dashboard: Settings > Domains
2. Add your domain
3. Update DNS records as shown
4. Update environment variables:
   ```bash
   NEXTAUTH_URL=https://your-domain.com
   SITE_URL=https://your-domain.com
   ```

---

## 🎯 **Option B: Netlify Deployment**

### **Steps 1-2: Same as Vercel (Database + GitHub)**

### **Step 3: Netlify Deployment**
1. Go to [netlify.com](https://netlify.com)
2. New site from Git
3. Choose your repository
4. **Build settings**:
   - **Build command**: `bun install && bun run db:generate && SKIP_ENV_VALIDATION=true ESLINT_NO_DEV_ERRORS=true bun run build`
   - **Publish directory**: `.next`

### **Step 4: Environment Variables**
Same as Vercel, but in Netlify: Site settings > Environment variables

### **Update CORS in netlify.toml:**
```toml
Access-Control-Allow-Origin = "https://your-netlify-site.netlify.app"
```

---

## 🚀 **Option C: Railway Deployment**

### **Step 1: Database + App in One**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Add GitHub repo
5. Environment variables auto-detected from `.env.production`

---

## ✅ **Post-Deployment Checklist**

### **1. Test Core Features (10 minutes)**
- [ ] User registration works
- [ ] Login/logout works
- [ ] Dashboard loads
- [ ] Create a test scraper
- [ ] Run a scraper (test with simple site)
- [ ] Check email notifications

### **2. Security Setup**
- [ ] Change all default passwords
- [ ] Verify HTTPS is working
- [ ] Test rate limiting
- [ ] Check CORS settings

### **3. Monitoring Setup**
- [ ] Set up error tracking (Sentry)
- [ ] Monitor database performance
- [ ] Set up uptime monitoring

### **4. Legal Compliance**
- [ ] Update Terms of Service
- [ ] Update Privacy Policy
- [ ] Add your contact information
- [ ] Set up GDPR compliance

---

## 🎯 **Quick Test Script**

After deployment, test with:

```bash
# Test API health
curl https://your-domain.com/api/health

# Test user registration
curl -X POST https://your-domain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123","firstName":"Test","lastName":"User"}'
```

---

## 💰 **Cost Breakdown (Monthly)**

**Free Tier Setup:**
- Vercel: Free (hobby plan)
- Supabase: Free (500MB database, 2GB transfer)
- SendGrid: Free (100 emails/day)
- **Total: $0/month**

**Production Setup:**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- SendGrid Essentials: $15/month
- Domain: $1/month
- **Total: ~$61/month**

---

## 🆘 **Troubleshooting**

### **Build Fails**
- Check environment variables are set
- Verify DATABASE_URL is correct
- Check build logs for specific errors

### **Database Connection Issues**
- Verify connection string format
- Check database is accessible
- Ensure SSL mode is correct

### **Email Not Working**
- Test SMTP credentials
- Check spam folder
- Verify FROM address

### **Scrapers Not Working**
- Check Playwright dependencies
- Verify proxy settings
- Test with simple websites first

---

## 📞 **Need Help?**

1. Check logs in deployment platform
2. Test locally first with production DATABASE_URL
3. Verify all environment variables
4. Check network/firewall settings

**Common Issues:**
- Forgot to set environment variables
- Database connection string wrong format
- Email service not configured
- Missing domain in CORS settings
