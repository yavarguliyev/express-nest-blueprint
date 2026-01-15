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
RUN npm run build

# Create a consistent output directory structure
RUN mkdir -p /app/admin/dist/browser && \
    if [ -d "dist/admin/browser" ]; then \
        cp -r dist/admin/browser/* /app/admin/dist/browser/; \
    elif [ -d "dist/browser" ]; then \
        cp -r dist/browser/* /app/admin/dist/browser/; \
    elif [ -d "dist" ]; then \
        cp -r dist/* /app/admin/dist/browser/; \
    fi

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

# Copy frontend built artifacts
COPY --from=frontend-builder /app/admin/dist/browser ./public/admin

# Copy the production entrypoint script
COPY deployment/prod/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3000

# Use entrypoint script to run migrations
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
