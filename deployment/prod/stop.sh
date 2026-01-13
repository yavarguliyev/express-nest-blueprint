#!/usr/bin/env bash

# Load bootstrap config
. ../docker-config/bootstrap.sh || PROJECT_NAME="express_nest_blueprint"

echo "Stopping $PROJECT_NAME (PROD)..."

docker-compose --project-name $PROJECT_NAME -f docker-compose.yml stop
