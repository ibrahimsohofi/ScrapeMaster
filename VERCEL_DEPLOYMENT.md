# 🚀 Vercel Deployment Guide for ScrapeMaster

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Cloud Database**: You'll need a PostgreSQL database (recommended providers below)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Set Up Cloud Database

### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Create a new project or select existing one
3. Navigate to "Storage" tab
4. Click "Create Database" → "Postgres"
5. Copy the connection string

### Option B: Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (URI format)

### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy the connection string

### Option D: PlanetScale
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Copy the connection string

## Step 2: Environment Variables

Set up these environment variables in your Vercel project settings:

### Required Variables
```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Optional Variables (for enhanced features)
```bash
# AI Features
OPENAI_API_KEY="sk-..."

# Redis (for job queuing)
REDIS_URL="redis://..."

# CAPTCHA Solving
TWOCAPTCHA_API_KEY="..."
ANTICAPTCHA_API_KEY="..."
CAPMONSTER_API_KEY="..."
DEATHBYCAPTCHA_API_KEY="..."

# Proxy Providers
BRIGHTDATA_API_KEY="..."
OXYLABS_API_KEY="..."
IPROYAL_API_KEY="..."
RAYOBYTE_API_KEY="..."
SMARTPROXY_API_KEY="..."
PROXYMESH_API_KEY="..."
```

## Step 3: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
cd ScrapeMaster
vercel

# Follow the prompts:
# - Link to existing project or create new one
# - Set up environment variables when prompted
# - Deploy!
```

### Method 2: GitHub Integration
1. Push your code to GitHub
2. Go to Vercel dashboard
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy!

## Step 4: Database Setup

After deployment, you need to set up your production database:

```bash
# Generate Prisma client for production
npx prisma generate

# Push schema to production database
npx prisma db push

# Seed production database (optional)
npx prisma db seed
```

Or run these in Vercel CLI:
```bash
vercel env pull .env.production
npx prisma generate
npx prisma db push
```

## Step 5: Post-Deployment Setup

1. **Update App URL**: Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
2. **Test Login**: Use the seeded accounts:
   - Admin: `admin@acme.com` / `password123`
   - User: `user@acme.com` / `password123`
3. **Configure Custom Domain** (optional): Add your custom domain in Vercel settings

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Ensure your DATABASE_URL is correct
- Check if your database allows connections from Vercel IPs
- Verify SSL mode is set correctly

#### Build Errors
- Check that all environment variables are set
- Ensure Prisma client is generated correctly
- Review build logs in Vercel dashboard

#### Runtime Errors
- Check function logs in Vercel dashboard
- Verify API routes are working
- Ensure database schema is applied

### Build Commands

The project uses these commands during deployment:
- **Install**: `bun install`
- **Build**: `bun run db:generate && bun run build`

### Environment Variable Management

You can manage environment variables via:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Vercel CLI: `vercel env add <name>`
3. Pull local env: `vercel env pull .env.local`

## Performance Optimization

- Database connection pooling is enabled by default
- API routes have 30-second timeout
- Static assets are optimized automatically
- CDN caching is configured

## Security Features

- CORS protection enabled
- Security headers configured
- JWT authentication with secure cookies
- API rate limiting
- Input validation and sanitization

## Monitoring

- Built-in Vercel Analytics
- Error tracking configured
- Performance monitoring
- Database query optimization

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test database connectivity
4. Review the troubleshooting section above

For additional help, check the main README.md or open an issue on GitHub.
