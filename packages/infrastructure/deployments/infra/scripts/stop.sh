#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_LIB="${SCRIPT_DIR}/../../../common/scripts/infra-common.sh"
K8S_DIR="${SCRIPT_DIR}/../k8s"

if [ -f "$COMMON_LIB" ]; then
    source "$COMMON_LIB"
else
    # Fallback to simple colors if common library is not found
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'
    print_header() { echo -e "${YELLOW}=== $1 ===${NC}"; }
    print_info() { echo -e "${YELLOW}[INFO] $1${NC}"; }
    print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
    print_error() { echo -e "${RED}[ERROR] $1${NC}"; }
    print_success() { echo -e "${YELLOW}[SUCCESS] $1${NC}"; }
fi

print_header "Stopping Local Infrastructure"

# Delete application components (keep bases and databases for faster restart)
print_info "Scaling down application targets..."
kubectl delete -f "${K8S_DIR}/api/" --ignore-not-found --wait=false
kubectl delete -f "${K8S_DIR}/worker/worker-manifests.yaml" --ignore-not-found --wait=false

# Only delete KEDA resources if KEDA is installed
if kubectl api-resources | grep -q "scaledobjects"; then
    kubectl delete -f "${K8S_DIR}/worker/worker-keda.yaml" --ignore-not-found --wait=false
fi

print_success "Infrastructure application layer stopped! 🛑"
