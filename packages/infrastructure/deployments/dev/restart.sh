#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../common/scripts/infra-common.sh"

# Source bootstrap for PROJECT_NAME
if [ -f "${SCRIPT_DIR}/../../common/docker-config/bootstrap.sh" ]; then
    . "${SCRIPT_DIR}/../../common/docker-config/bootstrap.sh"
fi
PROJECT_NAME=${PROJECT_NAME:-express_nest_blueprint}

print_header "Restarting Development Environment"

print_info "Stopping services..."
bash "${SCRIPT_DIR}/stop.sh"

sleep 2

print_info "Starting services..."
bash "${SCRIPT_DIR}/start.sh"

print_success "Development environment restarted successfully!"
