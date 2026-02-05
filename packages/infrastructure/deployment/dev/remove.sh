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

. ../docker-config/bootstrap.sh

print_warn "⚠️  REMOVING all services and data for project: $PROJECT_NAME"
print_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_warn "This will remove:"
print_warn "  • All containers"
print_warn "  • All volumes (DATABASE DATA WILL BE LOST)"
print_warn "  • All networks"
print_warn "  • Monitoring data (Prometheus & Grafana)"
print_warn ""

# Ask for confirmation
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Removal cancelled."
    exit 0
fi

print_info "Removing all services..."

# Show running containers
docker ps --filter "name=$PROJECT_NAME" --format "table {{.Names}}\t{{.Status}}"

# Stop and remove containers with volumes
docker-compose --project-name $PROJECT_NAME down --volumes --remove-orphans

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

print_info ""
print_info "✅ Cleanup completed successfully!"
print_info ""
print_info "💡 To start fresh, run: bash start.sh"
print_info ""
