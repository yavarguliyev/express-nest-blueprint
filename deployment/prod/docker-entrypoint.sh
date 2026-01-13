#!/bin/sh
set -e

# Function to wait for database connectivity
wait_for_db() {
  echo "⏳ Waiting for database connectivity ($DB_HOST:$DB_PORT)..."
  counter=1
  while [ $counter -le 30 ]; do
    if nc -z -w 2 "$DB_HOST" "$DB_PORT"; then
      echo "✅ Database is reachable!"
      # Update DATABASE_URL if DB_HOST is an IP
      if echo "$DB_HOST" | grep -E -q '^[0-9.]+$'; then
        export DATABASE_URL=$(echo $DATABASE_URL | sed "s/@.*:5432/@$DB_HOST:5432/")
      fi
      return 0
    fi
    echo "😴 DB not reachable yet, retrying in 2s... ($counter/30)"
    sleep 2
    counter=$((counter + 1))
  done
  echo "❌ Database timed out"
  return 1
}

# Only run migrations in production
if [ "$NODE_ENV" = "production" ]; then
  wait_for_db
  echo "🔄 Running database migrations..."
  npm run migrate:up
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Development mode detected - skipping migrations (using schema.sql instead)"
fi

# Start the application
exec "$@"
