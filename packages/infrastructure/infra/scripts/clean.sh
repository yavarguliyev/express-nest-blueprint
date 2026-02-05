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

# Helper: Wait for cluster connectivity (Patient & Resilient)
wait_for_cluster_ready() {
    local retries=5
    local count=0
    local wait_sec=2
    
    while [ $count -lt $retries ]; do
        if kubectl version --client=true &> /dev/null && kubectl get nodes &> /dev/null; then
            return 0
        fi
        count=$((count + 1))
        [ $count -eq 1 ] && print_warn "Cluster not responding (connection blip?). Retrying with backoff..."
        sleep $wait_sec
        wait_sec=$((wait_sec * 2))
    done
    return 1
}

# Helper: Wait for Docker connectivity
wait_for_docker_ready() {
    local retries=3
    local count=0
    while [ $count -lt $retries ]; do
        if docker info &> /dev/null; then
            return 0
        fi
        count=$((count + 1))
        sleep 2
    done
    return 1
}

# 1. Terminate Project-Related Processes & Containers (Ultra Aggressive)
terminate_project_processes() {
  print_info "Cleaning up stray project processes and containers..."
  
  # 1a. Docker Compose Down (if files exist)
  if [ -f "${PROJECT_ROOT}/docker-compose.yml" ]; then
    print_info "Taking down Docker Compose (dev)..."
    docker-compose -f "${PROJECT_ROOT}/docker-compose.yml" down --remove-orphans 2>/dev/null || true
  fi
  if [ -f "${PROJECT_ROOT}/packages/infrastructure/docker-compose.prod.yml" ]; then
    print_info "Taking down Docker Compose (prod)..."
    docker-compose -f "${PROJECT_ROOT}/packages/infrastructure/docker-compose.prod.yml" down --remove-orphans 2>/dev/null || true
  fi

  # 1b. Forcefully Stop Project & Infra Containers (Aggressive)
  if wait_for_docker_ready; then
      print_info "Searching for project and infrastructure containers..."
      # Target all project-related components
      local IMAGE_PATTERNS=(
        "$IMAGE_NAME"
        "cp-zookeeper"
        "cp-kafka"
        "postgres"
        "redis"
        "minio"
        "prometheus"
        "grafana"
      )
      
      for pattern in "${IMAGE_PATTERNS[@]}"; do
        local CONTAINER_IDS=$(docker ps -a -q --filter "ancestor=$pattern")
        if [ -n "$CONTAINER_IDS" ]; then
          print_warn "Forcefully stopping/removing containers matching '$pattern': $CONTAINER_IDS"
          docker stop $CONTAINER_IDS 2>/dev/null || true
          docker rm -v -f $CONTAINER_IDS 2>/dev/null || true
        fi
      done
  fi

  # 1c. Kill by Port (Guaranteed to free up ports for ALL components)
  local PORTS=(
    8080 3000 3001 9090 9100 # App & Monitoring
    2181 9092              # Zookeeper & Kafka
    5432 6379              # Postgres & Redis
    9000 9001              # MinIO
  )
  for port in "${PORTS[@]}"; do
    if lsof -ti :$port > /dev/null 2>&1; then
      print_warn "Found process on port $port. Terminating..."
      lsof -ti :$port | xargs kill -9 2>/dev/null || true
    fi
  done

  # 1d. Kill by Name/Pattern
  local PATTERNS=(
    "kubectl port-forward" 
    "express-nest-blueprint" 
    "node packages/backend"
    "zookeeper"
    "kafka"
  )
  for pattern in "${PATTERNS[@]}"; do
    if pgrep -f "$pattern" > /dev/null 2>&1; then
      print_warn "Found stray processes matching '$pattern'. Terminating..."
      pkill -9 -f "$pattern" 2>/dev/null || true
    fi
  done

  # 1c. Clean up PID file
  if [ -f "$PORT_FORWARD_PID_FILE" ]; then
    rm -f "$PORT_FORWARD_PID_FILE"
  fi
}

# 2. Delete Kubernetes Resources (Multi-Namespace Hunter)
delete_k8s_resources() {
  print_info "Verifying cluster connectivity..."
  if ! wait_for_cluster_ready; then
    print_error "Cluster unreachable after multiple retries! Skipping Kubernetes resource deletion."
    K8S_CLEANUP_FAILED=true
    return
  fi

  # 2a. Delete by label across ALL namespaces (Targets leaks in 'default', etc.)
  print_info "Hunting for project resources across ALL namespaces..."
  local PROJECT_LABELS=("app=zookeeper" "app=kafka" "app=prometheus" "app=grafana" "service=postgres" "service=redis" "app=minio")
  for label in "${PROJECT_LABELS[@]}"; do
    kubectl delete all,pvc,configmap,secret,ingress -l "$label" --all-namespaces --ignore-not-found --wait=false 2>/dev/null || true
  done

  # 2b. Comprehensive deletion in the main namespace
  print_info "Deleting Kubernetes resources in namespace: express-nest-app..."
  
  # Delete by directory to be comprehensive
  kubectl delete -f "${K8S_DIR}/api/" --ignore-not-found --wait=false
  kubectl delete -f "${K8S_DIR}/worker/worker-manifests.yaml" --ignore-not-found --wait=false
  
  if kubectl api-resources | grep -q "scaledobjects"; then
    kubectl delete -f "${K8S_DIR}/worker/worker-keda.yaml" --ignore-not-found --wait=false
  fi

  kubectl delete -f "${K8S_DIR}/postgres/" --ignore-not-found --wait=false
  kubectl delete -f "${K8S_DIR}/redis/" --ignore-not-found --wait=false
  kubectl delete -f "${K8S_DIR}/minio/" --ignore-not-found --wait=false
  kubectl delete -f "${K8S_DIR}/kafka/" --ignore-not-found --wait=false
  
  # Monitoring stack (including dashboards)
  kubectl delete -f "${K8S_DIR}/monitoring/" --ignore-not-found --wait=false
  kubectl delete -f "${K8S_DIR}/base/" --ignore-not-found --wait=false

  # NEW: Delete the namespace and WAIT for it to be gone (ensures real cleanup)
  print_info "Waiting for namespace 'express-nest-app' to be fully deleted (this may take a minute)..."
  kubectl delete namespace express-nest-app --ignore-not-found --wait=true

  print_info "Kubernetes cleanup completed."
  K8S_CLEANUP_FAILED=false
}

# 3. Clean up Docker (Aggressive Purge)
cleanup_docker() {
  if [ "$SKIP_DOCKER" = true ]; then return; fi

  print_info "Removing project and infrastructure images..."
  
  # Explicitly target project and infra images
  local IMAGES_TO_REMOVE=(
    "$IMAGE_NAME"
    "confluentinc/cp-zookeeper"
    "confluentinc/cp-kafka"
    "postgres:15-alpine"
    "redis:7-alpine"
    "minio/minio:latest"
    "prom/prometheus:latest"
    "grafana/grafana:latest"
  )
  
  for img in "${IMAGES_TO_REMOVE[@]}"; do
    print_info "Removing image: $img..."
    docker rmi -f $img 2>/dev/null || true
  done

  print_info "Exhaustive Docker pruning..."
  # Remove ALL unused images (not just dangling)
  docker image prune -a -f
  
  print_info "Pruning unused Docker resources..."
  docker container prune -f
  docker network prune -f
  
  print_info "Pruning unused Docker volumes..."
  docker volume prune -f
  
  print_info "Docker cleanup completed!"
}

main() {
  # Always kill processes and containers first (even if daemons are unreachable)
  # Frees up ports so K8s/Docker commands have better chance of succeeding
  terminate_project_processes

  print_info "Starting global multi-namespace cleanup..."
  
  # Try Kubernetes cleanup
  delete_k8s_resources || K8S_CLEANUP_FAILED=true
  
  # Try Docker cleanup
  if ! wait_for_docker_ready; then
    print_error "ACTION REQUIRED: Docker daemon is unreachable. Please restart Docker Desktop."
    SKIP_DOCKER=true
  else
    SKIP_DOCKER=false
    cleanup_docker
  fi
  
  print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if [ "$SKIP_DOCKER" = true ] || [ "$K8S_CLEANUP_FAILED" = true ]; then
    print_warn "⚠️  DEEP CLEAN INCOMPLETE: CLI could not talk to daemons."
    print_warn "   - Stray processes (node, tunnels) HAVE been killed. ✅"
    print_warn "   - Hung containers/pods may still exist until daemons restart. ⏳"
    print_warn ""
    print_warn "👉 SOLUTION: Please restart Docker Desktop to finish the cleanup."
  else
    print_info "✅ CLEANUP COMPLETE: All resources and processes cleared."
  fi
  print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main
