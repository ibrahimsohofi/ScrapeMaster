#!/bin/bash

# Build static version of ScrapeMaster for deployment
echo "🚀 Building ScrapeMaster for static deployment..."

# Set environment variables for static build
export NODE_ENV=production
export SKIP_ENV_VALIDATION=true
export ESLINT_NO_DEV_ERRORS=true

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf out
rm -rf .next

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  bun install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bun run db:generate

# Build with static configuration
echo "🏗️ Building static version..."
NEXT_CONFIG_JS=next.config.static.js bun run build

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p static-build
cp -r out/* static-build/

# Create zip file for deployment
echo "🗜️ Creating deployment zip..."
cd static-build && zip -r9 ../scrapmaster-static.zip . && cd ..

echo "✅ Static build complete!"
echo "📁 Files ready in: static-build/"
echo "📦 Deployment zip: scrapmaster-static.zip"
echo ""
echo "🚀 To deploy to Netlify:"
echo "  1. Upload scrapmaster-static.zip to your hosting provider"
echo "  2. Extract and serve from web root"
echo "  3. Configure environment variables on hosting platform"
