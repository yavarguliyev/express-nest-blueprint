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

print_info "🚀 Starting Docker Compose with retry logic..."

# Pull images with retry logic to handle Docker Hub timeouts
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  print_info "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES: Pulling Docker images..."
  
  if COMPOSE_HTTP_TIMEOUT=300 docker-compose --project-name $PROJECT_NAME pull; then
    print_info "✅ Successfully pulled all images"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      print_warn "Pull failed, retrying in 10 seconds..."
      sleep 10
    else
      print_error "Failed to pull images after $MAX_RETRIES attempts"
      print_info "💡 You can try manually: docker-compose pull"
      exit 1
    fi
  fi
done

print_info "Starting services..."
docker-compose --project-name $PROJECT_NAME up -d

print_info "Cleaning up unused Docker resources..."
docker container prune -f
docker network prune -f
docker volume prune -f

print_info "📊 Docker disk usage:"
docker system df

print_info ""
print_info "✅ Services started successfully!"
print_info ""
print_info "🎯 Access Points:"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "📡 API:        http://localhost:3000/api/v1"
print_info "🎨 Admin UI:   http://localhost:8080"
print_info "📊 Prometheus: http://localhost:9090"
print_info "📈 Grafana:    http://localhost:3001 (admin/admin)"
print_info "💾 MinIO:      http://localhost:9001 (minioadmin/minioadmin)"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info ""