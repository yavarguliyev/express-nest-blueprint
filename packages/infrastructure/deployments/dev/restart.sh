#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../common/scripts/infra-common.sh"

PROJECT_NAME="express-nest-dev"

print_header "Restarting Development Environment"

print_info "Stopping services..."
bash "${SCRIPT_DIR}/stop.sh"

sleep 2

print_info "Starting services..."
bash "${SCRIPT_DIR}/start.sh"

print_success "Development environment restarted successfully!"
