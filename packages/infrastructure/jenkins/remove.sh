#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../common/scripts/infra-common.sh"

print_header "Removing Jenkins Server"

print_warning "This will remove the Jenkins container and ALL data (jobs, configurations, build history)"
read -p "Are you sure? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Aborted."
    exit 0
fi

docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" down -v

print_info "Cleaning up Docker resources..."
docker container prune -f
docker network prune -f
docker volume prune -f

print_info "📊 Docker disk usage after cleanup:"
docker system prune -a -f
docker system df

print_success "Jenkins server removed successfully"
print_info "To start fresh: bash ${SCRIPT_DIR}/start.sh"
