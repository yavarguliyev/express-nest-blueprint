#!/bin/bash
set -e

# Script to clean up the application from Kubernetes and Docker
# 🚿 Safely tears down the entire environment and performs system pruning

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K8S_DIR="${PROJECT_ROOT}/infra/k8s"
PORT_FORWARD_PID_FILE="/tmp/k8s-port-forward.pid"
IMAGE_NAME="express-nest-blueprint:latest"

print_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Check if Docker is running
if ! docker info &> /dev/null; then
  print_warn "Docker is not running. Will skip Docker cleanup."
  SKIP_DOCKER=true
else
  SKIP_DOCKER=false
fi

# 1. Terminate Port Forwarding
terminate_port_forwarding() {
  if [ -f "$PORT_FORWARD_PID_FILE" ]; then
    PID=$(cat "$PORT_FORWARD_PID_FILE")
    if ps -p "$PID" > /dev/null; then
      print_info "Terminating existing port-forward (PID: $PID)..."
      kill "$PID" 2>/dev/null || true
    fi
    rm -f "$PORT_FORWARD_PID_FILE"
  fi
}

# 2. Delete Kubernetes Resources
delete_k8s_resources() {
  print_info "Deleting Kubernetes resources..."
  
  # Delete by directory to be comprehensive
  kubectl delete -f "${K8S_DIR}/api/" --ignore-not-found

  # Delete worker manifests (excluding KEDA if not installed)
  kubectl delete -f "${K8S_DIR}/worker/worker-manifests.yaml" --ignore-not-found
  if kubectl api-resources | grep -q "scaledobjects"; then
    kubectl delete -f "${K8S_DIR}/worker/worker-keda.yaml" --ignore-not-found
  fi

  kubectl delete -f "${K8S_DIR}/postgres/" --ignore-not-found
  kubectl delete -f "${K8S_DIR}/redis/" --ignore-not-found
  kubectl delete -f "${K8S_DIR}/minio/" --ignore-not-found
  kubectl delete -f "${K8S_DIR}/kafka/" --ignore-not-found
  kubectl delete -f "${K8S_DIR}/base/" --ignore-not-found

  print_info "Kubernetes resources deleted successfully!"
}

# 3. Clean up Docker
cleanup_docker() {
  if [ "$SKIP_DOCKER" = true ]; then return; fi

  print_info "Removing project image: $IMAGE_NAME..."
  docker rmi -f $IMAGE_NAME 2>/dev/null || true

  print_info "Pruning unused Docker images (dangling and unused)..."
  # Remove dangling images (untagged)
  docker image prune -f
  
  # Remove unused images (not used by any container)
  print_info "Removing unused Docker images..."
  docker image prune -a -f --filter "until=24h"
  
  print_info "Pruning unused Docker resources..."
  docker container prune -f
  docker network prune -f
  
  print_info "Pruning unused Docker volumes..."
  docker volume prune -f
  
  print_info "Docker cleanup completed!"
}

main() {
  print_info "Starting global cleanup..."
  terminate_port_forwarding
  delete_k8s_resources
  cleanup_docker
  print_info "✅ Cleanup process completed successfully!"
}

main
