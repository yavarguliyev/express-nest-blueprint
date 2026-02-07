#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../common/scripts/infra-common.sh"

PROJECT_NAME="express-nest-prod"

print_header "Restarting Production Environment"

print_info "Stopping services..."
bash "${SCRIPT_DIR}/stop.sh"

sleep 2

print_info "Starting services..."
bash "${SCRIPT_DIR}/start.sh"

print_success "Production environment restarted successfully!"
