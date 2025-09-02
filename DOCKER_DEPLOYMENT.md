# 🐳 Docker Deployment Guide for DataVault Pro

Deploy **ScrapeMaster (DataVault Pro)** using Docker on various platforms including DigitalOcean App Platform.

## 🚀 Quick Deploy Options

### Option 1: DigitalOcean App Platform (Recommended)

1. **Fork the Repository** to your GitHub account

2. **Create a new App** on DigitalOcean:
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository
   - Select the forked `ScrapeMaster` repository

3. **Configure the App**:
   - **Service Type**: Web Service
   - **Source**: GitHub repository
   - **Branch**: main
   - **Autodeploy**: Enable

4. **Environment Variables**:
   ```bash
   NODE_ENV=production
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32-chars-minimum
   REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-32-chars-minimum
   NEXT_PUBLIC_APP_URL=${APP_URL}
   NEXT_TELEMETRY_DISABLED=1
   SEED_DATABASE=true
   ```

5. **Build Settings**:
   - **Build Command**:
     ```bash
     bun install --frozen-lockfile && bun run db:generate && bun run build
     ```
   - **Run Command**:
     ```bash
     node server.js
     ```

6. **Deploy**: Click "Create Resources"

### Option 2: Railway

1. **Deploy to Railway**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Set Environment Variables**:
   - Add the same environment variables as above in Railway dashboard

### Option 3: Render

1. **Create New Web Service** on [Render](https://render.com)
2. **Connect Repository**: Link your GitHub repository
3. **Configure Service**:
   - **Build Command**: `bun install --frozen-lockfile && bun run db:generate && bun run build`
   - **Start Command**: `node server.js`
   - **Environment**: Node

## 🧪 Local Testing

### Test Docker Build Locally

1. **Build the Docker image**:
   ```bash
   docker build -t datavault-pro .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name datavault-pro \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL=file:./prisma/dev.db \
     -e JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32-chars-minimum \
     -e REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-32-chars-minimum \
     -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
     -e SEED_DATABASE=true \
     datavault-pro
   ```

3. **Check logs**:
   ```bash
   docker logs -f datavault-pro
   ```

4. **Access the application**: http://localhost:3000

### Using Docker Compose

1. **Start with docker-compose**:
   ```bash
   docker-compose -f docker-compose.simple.yml up -d
   ```

2. **View logs**:
   ```bash
   docker-compose -f docker-compose.simple.yml logs -f
   ```

3. **Stop the services**:
   ```bash
   docker-compose -f docker-compose.simple.yml down
   ```

## 🔐 Production Security

### Environment Variables for Production

```bash
# Required
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database  # Or SQLite file path
JWT_SECRET=<generate-32-char-secret>
REFRESH_SECRET=<generate-32-char-secret>

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
PORT=3000
HOSTNAME=0.0.0.0

# Optional: AI Features
OPENAI_API_KEY=<your-openai-key>

# Optional: Redis (for job queuing)
REDIS_URL=redis://redis:6379

# Optional: Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: CAPTCHA Services
TWOCAPTCHA_API_KEY=<your-2captcha-key>
ANTICAPTCHA_API_KEY=<your-anticaptcha-key>
```

### Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For REFRESH_SECRET
```

## 📊 Production Database Options

### Option 1: SQLite (Simple)
```bash
DATABASE_URL=file:./prisma/dev.db
```

### Option 2: PostgreSQL (Recommended for Production)
```bash
DATABASE_URL=postgresql://username:password@hostname:port/database
```

### Option 3: DigitalOcean Managed Database
- Create a managed PostgreSQL database in DigitalOcean
- Use the connection string provided

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
- **URL**: `/api/health`
- **Method**: GET
- **Response**: JSON with application status

### Logs
- Application logs are written to `/app/logs/`
- Use `docker logs` command to view container logs

### Metrics
- Built-in monitoring dashboard at `/dashboard/unified-monitoring`
- API metrics available at `/api/metrics`

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check environment variables are set correctly
   - Ensure all required secrets are at least 32 characters

2. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check database permissions
   - Ensure database is accessible from container

3. **Permission Errors**:
   - Container runs as non-root user `nextjs`
   - Ensure proper file permissions

4. **Memory Issues**:
   - Increase container memory allocation
   - Consider using smaller instance size for testing

### Debug Commands

```bash
# Check container status
docker ps

# View container logs
docker logs datavault-pro

# Execute commands in container
docker exec -it datavault-pro sh

# Check environment variables
docker exec datavault-pro env
```

## 🎯 Test Accounts

After deployment, use these accounts to test:

- **Admin**: admin@acme.com / password123
- **User**: user@acme.com / password123
- **Organization**: Acme Corp (PRO plan)

## 🔗 Useful Links

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Railway Deployment Guide](https://docs.railway.app/deploy/deployments)
- [Render Deployment Guide](https://render.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
