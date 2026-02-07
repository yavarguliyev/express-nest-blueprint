#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../common/scripts/infra-common.sh"

print_header "Starting Jenkins Server"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Start Jenkins
print_info "Starting Jenkins container..."
docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" up -d

# Wait for Jenkins to be ready
print_info "Waiting for Jenkins to start (this may take 30-60 seconds)..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        print_success "Jenkins is ready!"
        echo ""
        print_info "🚀 Jenkins Dashboard: http://localhost:8080"
        print_info "👤 Username: admin"
        print_info "🔑 Password: admin123"
        echo ""
        print_info "📦 Pre-configured deployment jobs:"
        print_info "   • Dev Environment: http://localhost:8080/job/deployments/job/dev-deployment/"
        print_info "   • Prod Environment: http://localhost:8080/job/deployments/job/prod-deployment/"
        print_info "   • Infrastructure (K8s): http://localhost:8080/job/deployments/job/infra-deployment/"
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done

print_warning "Jenkins is starting but not yet responding. Check logs with:"
print_info "docker logs jenkins-server"
