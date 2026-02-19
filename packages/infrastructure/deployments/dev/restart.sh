#!/usr/bin/env bash

set -euo pipefail

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
print_header() { echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${GREEN}$1${NC}"; echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source bootstrap for PROJECT_NAME
if [ -f "${SCRIPT_DIR}/../../common/docker-config/bootstrap.sh" ]; then
    . "${SCRIPT_DIR}/../../common/docker-config/bootstrap.sh"
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
  export COMPOSE_FILE
}

# Select compose file
select_compose_file

print_header "Restarting Development Environment"

print_info "Stopping services..."
if [ "$COMPOSE_FILE" = "both" ]; then
  docker-compose -f docker-compose.yml --project-name "${PROJECT_NAME}" down || true
  docker-compose -f docker-compose.local.yml --project-name "${PROJECT_NAME}" down || true
else
  docker-compose -f "${COMPOSE_FILE}" --project-name "${PROJECT_NAME}" down || true
fi

sleep 2

print_info "Starting services..."
if [ "$COMPOSE_FILE" = "both" ]; then
  print_warn "Cannot start both configurations simultaneously. Please run start.sh separately for each."
  exit 1
else
  bash "${SCRIPT_DIR}/start.sh" <<< "$(echo "$COMPOSE_FILE" | grep -q 'local' && echo '2' || echo '1')"
fi

print_success "Development environment restarted successfully!"
