#!/usr/bin/env bash
set -e

# Load bootstrap config
. ../docker-config/bootstrap.sh || PROJECT_NAME="express_nest_blueprint"

echo "Starting $PROJECT_NAME (PROD)..."

# Run docker-compose from current directory
docker-compose --project-name $PROJECT_NAME -f docker-compose.yml up -d --build --remove-orphans

# Show status
docker-compose --project-name $PROJECT_NAME -f docker-compose.yml ps
