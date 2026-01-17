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
COPY packages/common/package*.json ./packages/common/
COPY packages/backend/core-api/package*.json ./packages/backend/core-api/
COPY packages/frontend/admin/package*.json ./packages/frontend/admin/

# Install all dependencies
RUN npm ci

# Copy all source code
COPY . .

# Build all packages
RUN npm run build
RUN npm run build:frontend

# Prune dev dependencies (optional, but tricky in monorepos)
# Instead of full prune, we will just copy what we need in runner

# ----------------------------------------
# Stage 2: Runner
# ----------------------------------------
FROM node:20-slim AS runner

# Install runtime dependencies
RUN apt-get update && apt-get install -y netcat-openbsd procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/common ./packages/common
COPY --from=builder /app/packages/backend/core-api ./packages/backend/core-api
COPY --from=builder /app/packages/frontend/admin/dist/admin/browser ./public/admin
COPY --from=builder /app/packages/backend/core-api/database.json ./database.json
COPY --from=builder /app/packages/infrastructure/deployment/prod/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

# Create a non-root user for security (node user exists in slim)
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose the application port
EXPOSE 3000

# Use entrypoint script to run migrations
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "packages/backend/core-api/dist/main.js"]
