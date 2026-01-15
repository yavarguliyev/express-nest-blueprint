# ----------------------------------------
# Stage 1: Backend Builder
# ----------------------------------------
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY tsconfig.json .
COPY types ./types
COPY src ./src
COPY database ./database

RUN npm run build
RUN npm prune --production

# ----------------------------------------
# Stage 2: Frontend Builder
# ----------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/admin

COPY admin/package*.json ./
RUN npm ci

COPY admin/ ./
RUN npm run build -- --base-href /admin/

# ----------------------------------------
# Stage 3: Runner (API & Assets)
# ----------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy backend built artifacts
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./package.json
COPY --from=backend-builder /app/database ./database
COPY deployment/prod/docker-entrypoint.sh ./docker-entrypoint.sh

# Copy frontend built artifacts (in case we want to serve from backend)
COPY --from=frontend-builder /app/admin/dist/admin/browser ./public/admin

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
