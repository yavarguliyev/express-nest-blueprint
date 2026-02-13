#!/bin/bash
set -e

echo "🔧 Starting Express-Nest-Blueprint Application..."
echo "   Environment: ${NODE_ENV:-production}"
echo "   Run Mode: ${RUN_MODE:-node}"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
  echo "   Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Run database migrations (only for API role, not WORKER)
if [ "${APP_ROLE}" = "API" ] || [ "${COMPUTE_APP_ROLE}" = "API" ] || [ -z "${APP_ROLE}" ]; then
  echo "🗄️  Running database migrations..."
  cd /app/packages/backend/core-api
  npx node-pg-migrate up --migrations-dir database/migrations || echo "⚠️  Migrations failed or already up to date"
  cd /app
  echo "✅ Migrations complete!"
fi

# Launch application based on RUN_MODE
if [ "${RUN_MODE}" = "pm2" ]; then
    echo "🚀 Starting application in PM2 cluster mode..."
    echo "   Instances: max (auto-detect CPU cores)"
    echo "   Mode: cluster"
    cd /app
    exec pm2-runtime start ecosystem.config.json
else
    echo "🚀 Starting application in Node.js mode..."
    echo "   Instances: 1"
    echo "   Mode: single"
    exec node packages/backend/core-api/dist/main.js
fi
