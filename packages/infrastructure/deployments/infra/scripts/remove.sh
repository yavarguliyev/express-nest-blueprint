#!/usr/bin/env bash

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_LIB="${SCRIPT_DIR}/../../../common/scripts/infra-common.sh"

if [ -f "$COMMON_LIB" ]; then
    source "$COMMON_LIB"
else
    # Fallback to simple colors if common lib is not found
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'
    print_header() { echo -e "${RED}=== $1 ===${NC}"; }
    print_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
    print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
    print_error() { echo -e "${RED}[ERROR] $1${NC}"; }
    print_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
fi

K8S_DIR="${SCRIPT_DIR}/../k8s"
# Parse arguments
FORCE=false
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --force|-f) FORCE=true ;;
    *) print_error "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

print_header "Removing Local Kubernetes Infrastructure"

# Prompt for confirmation if not forced and in a terminal
if [[ "$FORCE" == "false" && -t 0 ]]; then
    read -p "Are you sure you want to completely remove the local infrastructure? [y/N] " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "Removal cancelled."
        exit 0
    fi
elif [[ "$FORCE" == "true" ]]; then
    print_warn "Force mode enabled. Skipping confirmation..."
fi

print_info "Completely removing all resources..."
kubectl delete -f "${K8S_DIR}/api/" --ignore-not-found
kubectl delete -f "${K8S_DIR}/worker/" --ignore-not-found
kubectl delete -f "${K8S_DIR}/monitoring/" --ignore-not-found
kubectl delete -f "${K8S_DIR}/postgres/" --ignore-not-found
kubectl delete -f "${K8S_DIR}/redis/" --ignore-not-found
kubectl delete -f "${K8S_DIR}/kafka/" --ignore-not-found
kubectl delete -f "${K8S_DIR}/minio/" --ignore-not-found
kubectl delete -f "${K8S_DIR}/base/" --ignore-not-found

print_success "Local Kubernetes infrastructure removed completely!"
