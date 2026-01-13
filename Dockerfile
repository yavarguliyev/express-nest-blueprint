# ----------------------------------------
# Stage 1: Builder
# ----------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (if any, e.g., bcrypt)
# python3, make, g++ are often needed for node-gyp
RUN apk add --no-cache python3 make g++

# Copy package definition
COPY package*.json ./

# Install ALL dependencies (including devDeps for build)
RUN npm ci

# Copy source code
COPY tsconfig.json .
COPY types ./types
COPY src ./src
COPY database ./database
COPY deployment/prod/docker-entrypoint.sh ./docker-entrypoint.sh

# Build the application
RUN npm run build

# Prune dev dependencies to prepare for production copy
RUN npm prune --production

# ----------------------------------------
# Stage 2: Runner
# ----------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/database ./database
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3000

# Use entrypoint script to run migrations before starting app
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
