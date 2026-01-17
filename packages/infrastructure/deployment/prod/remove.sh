#!/usr/bin/env bash
set -e

# Load bootstrap config
. ../docker-config/bootstrap.sh || PROJECT_NAME="express_nest_blueprint"

echo "Removing $PROJECT_NAME (PROD)..."
echo "================================================"

# Stop and remove containers, networks, volumes
docker-compose --project-name $PROJECT_NAME -f docker-compose.yml down --volumes --remove-orphans

# Force cleanup of any lingering containers with the project name
RUNNING_CONTAINERS=$(docker ps -a --filter "name=$PROJECT_NAME" -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
  echo "Forcing stop and kill of lingering containers..."
  docker kill $RUNNING_CONTAINERS 2>/dev/null || true
  docker rm $RUNNING_CONTAINERS 2>/dev/null || true
fi

# Deep cleanup similar to dev script
echo "Pruning unused resources..."
docker container prune -f
docker network prune -f
docker volume prune -f
# Note: In production we might want to be careful with 'system prune -a', 
# but user requested 'as I did for dev', so we include it but maybe without -a (images) unless explicit.
# Sticking to safer prune for prod unless user overrides.
docker system prune -f 

docker system df
echo "Done."
