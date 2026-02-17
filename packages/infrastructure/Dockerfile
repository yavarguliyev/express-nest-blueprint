# ----------------------------------------
# Stage 1: Builder
# ----------------------------------------
# ----------------------------------------
# Stage 1: Builder
# ----------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy root configurations
COPY package*.json tsconfig.json ./

# Copy package manifests for better caching
COPY packages/backend/common/package*.json ./packages/backend/common/
COPY packages/backend/core-api/package*.json ./packages/backend/core-api/
COPY packages/frontend/common/package*.json ./packages/frontend/common/
COPY packages/frontend/admin/package*.json ./packages/frontend/admin/

# Install all dependencies
RUN npm ci

# Install PM2 globally for cluster mode support
RUN npm install -g pm2

# Copy all source code
COPY . .

# Build all packages
RUN npm run build:backend:main
RUN npm run build:frontend:main

# Prune dev dependencies (optional, but tricky in monorepos)
# Instead of full prune, we will just copy what we need in runner

# ----------------------------------------
# Stage 2: Runner
# ----------------------------------------
FROM node:20-slim AS runner

# Install runtime dependencies
RUN apt-get update && apt-get install -y netcat-openbsd procps && rm -rf /var/lib/apt/lists/*

# Install PM2 globally for cluster mode support
RUN npm install -g pm2

WORKDIR /app

ENV NODE_ENV=production
ENV RUN_MODE=node

# Copy built artifacts and necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/common ./packages/backend/common
COPY --from=builder /app/packages/backend/core-api ./packages/backend/core-api
COPY --from=builder /app/packages/frontend/common ./packages/frontend/common
COPY --from=builder /app/packages/frontend/admin/dist/admin/browser ./public/admin
COPY --from=builder /app/packages/backend/core-api/database.json ./database.json

# Copy PM2 ecosystem configuration for cluster mode
COPY packages/backend/core-api/ecosystem.config.json ./ecosystem.config.json

# Copy smart entrypoint script that supports both node and pm2 modes
COPY packages/infrastructure/deployments/prod/docker-entrypoint-app.sh ./docker-entrypoint-app.sh

RUN chmod +x ./docker-entrypoint-app.sh

# Create a non-root user for security (node user exists in slim)
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose the application port
EXPOSE 3000

# Use smart entrypoint script
ENTRYPOINT ["./docker-entrypoint-app.sh"]
