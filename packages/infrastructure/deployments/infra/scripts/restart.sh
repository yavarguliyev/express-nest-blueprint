#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_LIB="${SCRIPT_DIR}/../../../common/scripts/infra-common.sh"

if [ -f "$COMMON_LIB" ]; then
    source "$COMMON_LIB"
else
    # Fallback to simple colors if common library is not found
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'
    print_header() { echo -e "${GREEN}=== $1 ===${NC}"; }
    print_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
    print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
    print_error() { echo -e "${RED}[ERROR] $1${NC}"; }
    print_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
fi

print_header "Restarting Local Kubernetes Infrastructure"

print_info "Stopping application components..."
bash "${SCRIPT_DIR}/stop.sh"

print_info "Cooling down (5s)..."
sleep 5

print_info "Starting application components..."
bash "${SCRIPT_DIR}/start.sh"

print_success "Infrastructure restarted successfully!"
