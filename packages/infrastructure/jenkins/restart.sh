#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../common/scripts/infra-common.sh"

print_header "Restarting Jenkins Server"

bash "${SCRIPT_DIR}/stop.sh"
sleep 2
bash "${SCRIPT_DIR}/start.sh"
