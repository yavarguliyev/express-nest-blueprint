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

# Source bootstrap for PROJECT_NAME
if [ -f ../../common/docker-config/bootstrap.sh ]; then
    . ../../common/docker-config/bootstrap.sh
fi
PROJECT_NAME=${PROJECT_NAME:-express_nest_blueprint}

# Select docker-compose file
select_compose_file() {
  echo ""
  print_menu "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_menu "  Select Docker Compose Configuration"
  print_menu "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_menu "  1) Full Stack (docker-compose.yml)"
  print_menu "  2) Local Development (docker-compose.local.yml)"
  print_menu "  3) Both"
  print_menu "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  read -p "Enter your choice (1, 2, or 3): " choice
  
  case $choice in
    1)
      COMPOSE_FILE="docker-compose.yml"
      print_info "Selected: Full Stack"
      ;;
    2)
      COMPOSE_FILE="docker-compose.local.yml"
      print_info "Selected: Local Development"
      ;;
    3)
      COMPOSE_FILE="both"
      print_info "Selected: Both configurations"
      ;;
    *)
      print_error "Invalid choice. Defaulting to Full Stack."
      COMPOSE_FILE="docker-compose.yml"
      ;;
  esac
  echo ""
}

# Select compose file
select_compose_file

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

print_warn "⚠️  REMOVING all services and data for project: $PROJECT_NAME"
print_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_warn "This will remove:"
print_warn "  • All containers"
print_warn "  • All volumes (DATABASE DATA WILL BE LOST)"
print_warn "  • All networks"
print_warn "  • Monitoring data (Prometheus & Grafana)"
print_warn ""

# Safety check
if [ "$FORCE" = "true" ]; then
    print_warn "Force mode enabled. Skipping confirmation..."
elif [ -t 0 ]; then
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Removal cancelled."
        exit 0
    fi
else
    print_warn "Non-interactive environment detected (CI). Proceeding with cleanup..."
fi

print_info "Removing all services..."

if [ "$COMPOSE_FILE" = "both" ]; then
  print_info "Removing Full Stack..."
  docker-compose -f docker-compose.yml --project-name $PROJECT_NAME down --volumes --remove-orphans || true
  
  print_info "Removing Local Development..."
  docker-compose -f docker-compose.local.yml --project-name $PROJECT_NAME down --volumes --remove-orphans || true
else
  # Stop and remove containers with volumes
  docker-compose -f "${COMPOSE_FILE}" --project-name $PROJECT_NAME down --volumes --remove-orphans || true
fi

# Force kill and remove any remaining containers
RUNNING_CONTAINERS=$(docker ps -a --filter "name=$PROJECT_NAME" -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
  print_warn "Force removing remaining containers..."
  docker kill $RUNNING_CONTAINERS 2>/dev/null || true
  docker rm $RUNNING_CONTAINERS 2>/dev/null || true
fi

print_info "Cleaning up project-specific Docker resources..."

docker container prune -f
docker network prune -f
docker volume prune -f

print_info "📊 Docker disk usage:"

docker system prune -a -f
docker system df

print_info "✅ Cleanup completed successfully!"
