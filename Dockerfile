# Production Dockerfile for DataVault Pro
# Multi-stage build for optimized production image

# 🔧 Build Args
ARG NODE_VERSION=18-alpine
ARG BUN_VERSION=1.0.0
ARG BUILD_TIME
ARG COMMIT_SHA

# =============================================================================
# STAGE 1: Dependencies Installation
# =============================================================================
FROM node:${NODE_VERSION} as deps

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    ca-certificates \
    && update-ca-certificates

# Install Bun
RUN npm install -g bun@${BUN_VERSION}

# Copy package files
COPY package.json bun.lockb ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Generate Prisma client
RUN bun run db:generate

# =============================================================================
# STAGE 2: Builder
# =============================================================================
FROM node:${NODE_VERSION} as builder

WORKDIR /app

# Install Bun
RUN npm install -g bun@${BUN_VERSION}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for build-time metadata
ARG BUILD_TIME
ARG COMMIT_SHA
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN bun run build

# =============================================================================
# STAGE 3: Production Runtime
# =============================================================================
FROM node:${NODE_VERSION} as runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Install system dependencies and security updates
RUN apk add --no-cache \
    dumb-init \
    ca-certificates \
    tzdata \
    && update-ca-certificates \
    && apk upgrade --no-cache

# Install Bun for runtime
RUN npm install -g bun@${BUN_VERSION}

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories for logs and uploads
RUN mkdir -p /app/logs /app/uploads /app/tmp && \
    chown -R nextjs:nodejs /app/logs /app/uploads /app/tmp

# Security: Remove package managers
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -rf /usr/local/bin/npm \
    && rm -rf /usr/local/bin/npx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Build metadata labels
LABEL org.opencontainers.image.title="DataVault Pro"
LABEL org.opencontainers.image.description="Enterprise Web Scraping SaaS Platform"
LABEL org.opencontainers.image.source="https://github.com/ibrahimsohofi/ScrapeMaster"
LABEL org.opencontainers.image.version="${COMMIT_SHA}"
LABEL org.opencontainers.image.created="${BUILD_TIME}"
LABEL org.opencontainers.image.vendor="DataVault Pro"
LABEL maintainer="DataVault Pro Team"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["/usr/local/bin/docker-entrypoint.sh"]
