#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../common/scripts/infra-common.sh"

print_header "Stopping Jenkins Server"

docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" stop

print_success "Jenkins server stopped successfully"
print_info "To start again: bash ${SCRIPT_DIR}/start.sh"
