# 🚀 Deploy DataVault Pro to Vercel

This guide will help you deploy the DataVault Pro application to Vercel, which is the optimal platform for this Next.js application.

## 📋 Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works)
- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`
- GitHub account (optional, for automatic deployments)

## 🔧 Method 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy the Application
```bash
cd ScrapeMaster
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your personal account
- **Link to existing project?** → No
- **Project name** → `datavault-pro` (or your preferred name)
- **Directory** → `./` (current directory)
- **Override settings?** → No

### Step 4: Set Environment Variables
After deployment, set these environment variables in your Vercel dashboard:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-32-chars"
REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
NEXTAUTH_URL="https://your-app.vercel.app"

# Application
NODE_ENV="production"
SKIP_ENV_VALIDATION="true"
ESLINT_NO_DEV_ERRORS="true"

# Optional: AI Features
OPENAI_API_KEY="your-openai-api-key"

# Optional: Disable complex features for demo
DISABLE_BACKUP_SYSTEM="true"
DISABLE_SSL_MANAGER="true"
DISABLE_ENTERPRISE_FEATURES="true"
```

## 🔧 Method 2: Deploy via Vercel Dashboard

### Step 1: Push to GitHub
1. Create a new repository on GitHub
2. Push your code:
```bash
cd ScrapeMaster
git init
git add .
git commit -m "Initial commit: DataVault Pro"
git branch -M main
git remote add origin https://github.com/yourusername/datavault-pro.git
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Build Command**: `bun install && bun run db:generate && bun run build`
   - **Output Directory**: `.next`
   - **Install Command**: `bun install`

### Step 3: Add Environment Variables
In the Vercel dashboard, go to Settings > Environment Variables and add all the variables listed above.

## 🗄️ Database Configuration

For production, you'll want to use a proper database:

### Option 1: PlanetScale (Recommended)
```bash
DATABASE_URL="mysql://username:password@host/database?sslaccept=strict"
```

### Option 2: Neon (PostgreSQL)
```bash
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### Option 3: Supabase (PostgreSQL)
```bash
DATABASE_URL="postgresql://postgres:password@db.host.supabase.co:5432/postgres"
```

## 🔄 Automatic Deployments

Once connected to GitHub, Vercel will automatically deploy:
- **Production**: When you push to `main` branch
- **Preview**: For pull requests and other branches

## 🛠️ Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## 🐛 Troubleshooting

### Build Errors
- Check environment variables are set correctly
- Ensure `SKIP_ENV_VALIDATION=true` is set
- Verify all required secrets are at least 32 characters

### Database Issues
- For development: Use SQLite (already configured)
- For production: Use cloud database (PlanetScale, Neon, etc.)

### Memory Issues
- Upgrade to Vercel Pro if needed for larger memory limits
- Consider enabling edge functions for lighter workloads

## 📊 Post-Deployment

After successful deployment:

1. **Access your app**: `https://your-app.vercel.app`
2. **Check Vercel logs**: Monitor for any runtime errors
3. **Test functionality**: Verify all features work correctly
4. **Set up monitoring**: Use Vercel Analytics or external tools

## 🔧 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) |
| `REFRESH_SECRET` | Yes | Refresh token secret (32+ chars) |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js secret |
| `NEXTAUTH_URL` | Yes | Your app's URL |
| `OPENAI_API_KEY` | No | For AI features |
| `NODE_ENV` | Yes | Set to "production" |
| `SKIP_ENV_VALIDATION` | Yes | Set to "true" |

## 🎉 Success!

Your DataVault Pro application should now be live on Vercel!

**Demo Credentials:**
- Admin: `admin@acme.com`
- User: `user@acme.com`
- Organization: Acme Corp

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
