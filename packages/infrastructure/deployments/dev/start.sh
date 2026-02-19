#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; }
print_menu() { echo -e "${BLUE}$1${NC}"; }

# Helper to print a clickable link if the terminal supports it
print_link() {
  local label=$1
  local url=$2
  local extra=$3
  echo -e "${GREEN}[INFO] ${label}: \e]8;;${url}\a${url}\e]8;;\a ${extra}${NC}"
}

. ../../common/docker-config/bootstrap.sh

# Select docker-compose file
select_compose_file() {
  echo ""
  print_menu "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_menu "  Select Docker Compose Configuration"
  print_menu "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_menu "  1) Full Stack (docker-compose.yml)"
  print_menu "     - All services including app-api and app-worker"
  print_menu "     - Redis cluster (8 nodes)"
  print_menu "     - PostgreSQL with replicas"
  print_menu "     - Full monitoring stack"
  print_menu ""
  print_menu "  2) Local Development (docker-compose.local.yml)"
  print_menu "     - Infrastructure only (DB, Redis, Kafka, MinIO)"
  print_menu "     - Standalone Redis (no cluster)"
  print_menu "     - Single PostgreSQL instance"
  print_menu "     - For running app locally outside Docker"
  print_menu "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  read -p "Enter your choice (1 or 2): " choice
  
  case $choice in
    1)
      COMPOSE_FILE="docker-compose.yml"
      COMPOSE_MODE="full"
      print_info "Selected: Full Stack"
      ;;
    2)
      COMPOSE_FILE="docker-compose.local.yml"
      COMPOSE_MODE="local"
      print_info "Selected: Local Development"
      ;;
    *)
      print_error "Invalid choice. Defaulting to Full Stack."
      COMPOSE_FILE="docker-compose.yml"
      COMPOSE_MODE="full"
      ;;
  esac
  echo ""
}

# Select compose file
select_compose_file

# Ensure .env file exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    print_info "Creating .env from .env.example..."
    cp .env.example .env
  else
    print_warn ".env.example not found, creating empty .env..."
    touch .env
  fi
fi

print_info "🚀 Starting Docker Compose with retry logic..."

# Pull images with retry logic to handle Docker Hub timeouts
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  print_info "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES: Pulling Docker images..."
  
  if COMPOSE_HTTP_TIMEOUT=300 docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME pull --ignore-pull-failures; then
    print_info "✅ Successfully pulled all images"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      print_warn "Pull failed, retrying in 10 seconds..."
      sleep 10
    else
      print_error "Failed to pull images after $MAX_RETRIES attempts"
      print_info "💡 You can try manually: docker-compose -f $COMPOSE_FILE pull"
      exit 1
    fi
  fi
done

initialize_redis_cluster() {
  print_info "Checking Redis cluster status..."
  
  # Load REDIS_PASSWORD from .env
  local REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' .env | cut -d '=' -f2-)
  
  # Wait for all nodes to be ready
  print_info "Waiting for all Redis nodes to be reachable..."
  for node in {1..8}; do
    until docker exec redis_node_${node} redis-cli -a "${REDIS_PASSWORD}" ping > /dev/null 2>&1; do
      echo -n "."
      sleep 1
    done
  done
  echo ""

  # Check cluster state
  local state=$(docker exec redis_node_1 redis-cli -a "${REDIS_PASSWORD}" cluster info 2>/dev/null | grep 'cluster_state:' | cut -d ':' -f2 | tr -d '\r')
  
  if [ "$state" != "ok" ]; then
    print_warn "Redis cluster is not initialized (state: $state). Initializing now..."
    
    # Ensure nodes are clean before creating cluster
    print_info "Cleaning Redis nodes..."
    for node in {1..8}; do
      docker exec redis_node_${node} redis-cli -a "${REDIS_PASSWORD}" flushall > /dev/null 2>&1 || true
      docker exec redis_node_${node} redis-cli -a "${REDIS_PASSWORD}" cluster reset > /dev/null 2>&1 || true
    done

    docker exec redis_node_1 redis-cli -a "${REDIS_PASSWORD}" --cluster create \
      redis_node_1:6379 \
      redis_node_2:6379 \
      redis_node_3:6379 \
      redis_node_4:6379 \
      redis_node_5:6379 \
      redis_node_6:6379 \
      redis_node_7:6379 \
      redis_node_8:6379 \
      --cluster-replicas 1 --cluster-yes || print_error "Failed to initialize Redis cluster"
    
    # Wait for cluster to stabilize
    sleep 5
    print_info "Redis cluster initialized successfully!"
  else
    print_info "Redis cluster is already healthy."
  fi
}

print_info "Starting services with project name: ${PROJECT_NAME}..."
docker-compose -f "${COMPOSE_FILE}" --project-name "${PROJECT_NAME}" up -d

# Initialize Redis Cluster if needed (only for full stack)
if [ "$COMPOSE_MODE" = "full" ]; then
  initialize_redis_cluster
else
  print_info "Skipping Redis cluster initialization (using standalone Redis)"
fi

print_info "Cleaning up unused Docker resources..."

docker container prune -f
docker network prune -f
docker volume prune -f

print_info "📊 Docker disk usage:"

docker system prune -a -f
docker system df

print_info ""
print_info "✅ Services started successfully!"
print_info ""
print_info "🎯 Access Points:"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_link "📡 API"        "http://localhost:3000/api/v1"
print_link "🎨 Admin UI"   "http://localhost:3000/admin"
print_link "📊 Prometheus" "http://localhost:9090"
print_link "📈 Grafana"    "http://localhost:3001" "(admin/admin)"
print_link "💾 MinIO"      "http://localhost:9001" "(minioadmin/minioadmin)"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "💡 Tip: In many terminals, you can CMD+Click the links above to open them."
print_info ""