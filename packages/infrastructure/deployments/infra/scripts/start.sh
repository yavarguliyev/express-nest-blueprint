#!/usr/bin/env bash

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_LIB="${SCRIPT_DIR}/../../../common/scripts/infra-common.sh"
K8S_DIR="${SCRIPT_DIR}/../k8s"
NAMESPACE="express-nest-app"

if [ -f "$COMMON_LIB" ]; then
    source "$COMMON_LIB"
else
    # Fallback logger if common library is not found
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

# Helper: Wait for cluster connectivity
wait_for_cluster_ready() {
    local retries=5
    local count=0
    local wait_sec=2
    while [ $count -lt $retries ]; do
        if kubectl version --client=true &> /dev/null && kubectl get nodes &> /dev/null; then return 0; fi
        count=$((count + 1))
        sleep $wait_sec
        wait_sec=$((wait_sec * 2))
    done
    return 1
}

# Setup /etc/hosts entries for local domains (Context-Aware)
setup_hosts() {
    # If running inside a container, skip hosts mapping (handled by --extra-hosts/docker-compose)
    if [ -f /.dockerenv ]; then
        print_info "Running inside container, skipping /etc/hosts modification."
        return 0
    fi

    local DOMAINS=("api.local" "grafana.local" "prometheus.local" "minio.local")
    local NEEDS_UPDATE=false
    
    for domain in "${DOMAINS[@]}"; do
        if ! grep -qw "$domain" /etc/hosts; then
            NEEDS_UPDATE=true
            break
        fi
    done

    if [ "$NEEDS_UPDATE" = true ]; then
        print_info "Checking /etc/hosts for local domains..."
        # Use sudo only if not root and sudo exists
        local SUDO_CMD=""
        if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
            SUDO_CMD="sudo"
        fi

        # Ensure last line has a newline before appending
        if [ -n "$(tail -c 1 /etc/hosts)" ]; then
            echo "" | $SUDO_CMD tee -a /etc/hosts > /dev/null
        fi

        for domain in "${DOMAINS[@]}"; do
            if ! grep -qw "$domain" /etc/hosts; then
                print_info "   + Adding $domain to /etc/hosts..."
                echo "127.0.0.1 $domain" | $SUDO_CMD tee -a /etc/hosts > /dev/null
            fi
        done
        print_info "✅ /etc/hosts is configured."
    else
        print_info "✅ /etc/hosts already configured with all domains."
    fi
}

print_header "Restoring Infrastructure Integrity"

# 1. Base Setup
print_info "Phase 1: Base Configurations..."
kubectl apply -f "${K8S_DIR}/base/namespace.yaml"
kubectl apply -f "${K8S_DIR}/base/configmap.yaml"
kubectl apply -f "${K8S_DIR}/base/secrets.yaml"
kubectl apply -f "${K8S_DIR}/base/ingress.yaml"

# 2. Wave A: Infrastructure
print_info "Phase 2: Deploying Infrastructure Services..."
kubectl apply -f "${K8S_DIR}/postgres/"
kubectl apply -f "${K8S_DIR}/redis/"
kubectl apply -f "${K8S_DIR}/minio/"
kubectl apply -f "${K8S_DIR}/kafka/"

print_info "Waiting for Infrastructure readiness..."
kubectl wait --for=condition=ready pod -l service=postgres -n $NAMESPACE --timeout=120s || true
kubectl wait --for=condition=ready pod -l service=redis -n $NAMESPACE --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=minio -n $NAMESPACE --timeout=120s || true

# 3. Wave B: Monitoring
print_info "Phase 3: Deploying Monitoring Stack..."
kubectl apply -f "${K8S_DIR}/monitoring/grafana-dashboards.yaml"
kubectl apply -f "${K8S_DIR}/monitoring/prometheus-manifests.yaml"
kubectl apply -f "${K8S_DIR}/monitoring/grafana-manifests.yaml"

# 4. Wave C: Application
print_info "Phase 4: Deploying Application..."
print_info "Running database migrations..."
kubectl delete job db-migration -n $NAMESPACE --ignore-not-found
kubectl apply -f "${K8S_DIR}/base/migration-job.yaml"
kubectl wait --for=condition=complete job/db-migration -n $NAMESPACE --timeout=120s || print_warn "Migration job still running..."

print_info "Starting application components..."
kubectl apply -f "${K8S_DIR}/api/"
kubectl apply -f "${K8S_DIR}/worker/worker-manifests.yaml"

if kubectl api-resources | grep -q "scaledobjects"; then
    kubectl apply -f "${K8S_DIR}/worker/worker-keda.yaml"
fi

# Ensure local domains are mapped before health check
setup_hosts

print_info "Waiting for application rollout..."
kubectl rollout status deployment/api-deployment -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/worker-deployment -n $NAMESPACE --timeout=180s

# 5. Health Verification
print_info "Verifying health at http://api.local..."
HEALTH_KEY=$(kubectl get secret app-secrets -n $NAMESPACE -o jsonpath='{.data.HEALTH_CHECK_SECRET}' | base64 -d)
for i in {1..5}; do
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Health-Key: $HEALTH_KEY" http://api.local/api/v1/health/ready || echo "failed")
    if [ "$HEALTH_STATUS" = "200" ]; then
        print_info "✅ API is Healthy and Ready (via Ingress)"
        break
    fi
    echo -e "\033[1;33m[WARN] Waiting for readiness... ($i/5) status: $HEALTH_STATUS\033[0m"
    sleep 5
done

print_success "Infrastructure restored and running! 🏗️✨"
