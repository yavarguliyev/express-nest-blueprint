#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Source bootstrap for PROJECT_NAME
if [ -f ../../common/docker-config/bootstrap.sh ]; then
    . ../../common/docker-config/bootstrap.sh
fi
PROJECT_NAME=${PROJECT_NAME:-express_nest_blueprint}

# Parse arguments
FORCE=false
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --force|-f) FORCE=true ;;
    *) print_error "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Ensure .env file exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    print_info "Creating .env from .env.example..."
    cp .env.example .env
  else
    touch .env
  fi
fi

print_error "⚠️  REMOVING PRODUCTION services and data for project: $PROJECT_NAME"
print_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_warn "This will remove:"
print_warn "  • All containers"
print_warn "  • All volumes (PRODUCTION DATABASE DATA WILL BE LOST)"
print_warn "  • All networks"
print_warn "  • Monitoring data (Prometheus & Grafana)"
print_warn ""

# Safety check
if [ "$FORCE" = "true" ]; then
    print_warn "Force mode enabled. Skipping confirmation for PRODUCTION removal..."
elif [ -t 0 ]; then
    read -p "⚠️  Are you ABSOLUTELY sure? (type 'yes' to confirm): " -r
    echo
    if [[ ! $REPLY == "yes" ]]; then
        print_info "Removal cancelled."
        exit 0
    fi
else
    print_warn "Non-interactive environment detected (CI). Proceeding with PRODUCTION cleanup..."
fi

print_info "Removing all production services..."

# Stop and remove containers with volumes
docker-compose --project-name $PROJECT_NAME -f docker-compose.yml down --volumes --remove-orphans || true

# Force kill and remove any remaining containers
RUNNING_CONTAINERS=$(docker ps -a --filter "name=$PROJECT_NAME" -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
  print_warn "Force removing remaining containers..."
  docker kill $RUNNING_CONTAINERS 2>/dev/null || true
  docker rm $RUNNING_CONTAINERS 2>/dev/null || true
fi

print_info "Cleaning up Docker resources..."
docker container prune -f
docker network prune -f
docker volume prune -f

print_info "📊 Docker disk usage after cleanup:"
docker system prune -a -f
docker system df

print_info "✅ Production cleanup completed successfully!"
