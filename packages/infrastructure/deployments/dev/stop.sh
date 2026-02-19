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

. ../../common/docker-config/bootstrap.sh

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

print_info "🛑 Stopping services..."
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$COMPOSE_FILE" = "both" ]; then
  print_info "Stopping Full Stack..."
  docker-compose -f docker-compose.yml --project-name "${PROJECT_NAME}" down || true
  
  print_info "Stopping Local Development..."
  docker-compose -f docker-compose.local.yml --project-name "${PROJECT_NAME}" down || true
else
  print_info "Currently running containers:"
  docker ps --filter "name=$PROJECT_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

  print_info ""
  print_info "Stopping containers using: ${COMPOSE_FILE}..."
  docker-compose -f "${COMPOSE_FILE}" --project-name "${PROJECT_NAME}" down
fi

# Force kill any remaining containers
RUNNING_CONTAINERS=$(docker ps -a --filter "name=${PROJECT_NAME}" -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
  print_warn "Force stopping remaining containers for project: ${PROJECT_NAME}..."
  docker kill $RUNNING_CONTAINERS 2>/dev/null || true
fi

print_info ""
print_info "✅ All services stopped successfully!"
print_info ""
print_info "💡 To start services again, run: bash start.sh"
print_info ""