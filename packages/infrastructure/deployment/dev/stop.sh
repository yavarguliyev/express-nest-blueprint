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

print_info "🛑 Stopping all services for project: $PROJECT_NAME"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Show running containers
print_info "Currently running containers:"
docker ps --filter "name=$PROJECT_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

print_info ""
print_info "Stopping containers..."
docker-compose --project-name $PROJECT_NAME down

# Force kill any remaining containers
RUNNING_CONTAINERS=$(docker ps -a --filter "name=$PROJECT_NAME" -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
  print_warn "Force stopping remaining containers..."
  docker kill $RUNNING_CONTAINERS 2>/dev/null || true
fi

print_info ""
print_info "✅ All services stopped successfully!"
print_info ""
print_info "💡 To start services again, run: bash start.sh"
print_info ""