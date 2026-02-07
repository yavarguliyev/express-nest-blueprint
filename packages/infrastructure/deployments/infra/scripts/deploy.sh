#!/bin/bash
set -e

# Professional Kubernetes Deployment Script
# 🚀 Refactored with automated port-forwarding and advanced orchestration

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "${SCRIPT_DIR}/../../../../.." && pwd)
K8S_DIR="${SCRIPT_DIR}/../k8s"

IMAGE_NAME="express-nest-blueprint:latest"
PORT_FORWARD_PID_FILE="/tmp/k8s-port-forward.pid"
NAMESPACE="express-nest-app"

# Flags
INSTALL_INGRESS=false
SKIP_BUILD=false
SKIP_VERIFY=false
KEEP_PORT_FORWARD=false

print_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Parsing arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --install-ingress) INSTALL_INGRESS=true ;;
        --skip-build) SKIP_BUILD=true ;;
        --no-verify) SKIP_VERIFY=true ;;
        --keep-port-forward) KEEP_PORT_FORWARD=true ;;
        *) print_error "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Check prerequisites
if ! command -v kubectl &> /dev/null; then print_error "kubectl not found"; exit 1; fi
if ! command -v docker &> /dev/null; then print_error "docker not found"; exit 1; fi

# Helper: Wait for cluster connectivity (Resiliennt)
wait_for_cluster_ready() {
    local retries=5
    local count=0
    local wait_sec=2
    
    while [ $count -lt $retries ]; do
        if kubectl version --client=true &> /dev/null && kubectl get nodes &> /dev/null; then
            return 0
        fi
        count=$((count + 1))
        print_warn "Cluster not responding (connection blip?). Retrying in ${wait_sec}s... ($count/$retries)"
        sleep $wait_sec
        wait_sec=$((wait_sec * 2))
    done
    return 1
}

# Terminate existing port-forwarding (Safer)
if [ -f "$PORT_FORWARD_PID_FILE" ]; then
    PIDS=$(cat "$PORT_FORWARD_PID_FILE")
    print_info "Cleaning up existing tunnels: $PIDS"
    for PID in $PIDS; do
        if ps -p "$PID" > /dev/null; then
            kill "$PID" 2>/dev/null || true
            sleep 0.5
            kill -9 "$PID" 2>/dev/null || true
        fi
    done
    rm -f "$PORT_FORWARD_PID_FILE"
fi

echo "🏗️  Starting Professional Deployment Flow..."

# 1. Ingress Controller Installation
if [ "$INSTALL_INGRESS" = true ]; then
    print_info "Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
    print_info "Waiting for Ingress Controller..."
    kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s || print_warn "Ingress Controller still starting..."
fi

# 2. Docker Image Build
if [ "$SKIP_BUILD" = false ]; then
    print_info "Building Docker image: $IMAGE_NAME..."
    (cd "${ROOT_DIR}" && docker build -t $IMAGE_NAME -f packages/infrastructure/Dockerfile .)
else
    print_info "Skipping Docker build..."
fi

# 3. Create Namespace and Apply Base Config (ConfigMap, Secrets, Ingress)
print_info "Creating namespace..."
kubectl apply -f "${K8S_DIR}/base/namespace.yaml"

print_info "Applying base configurations..."
kubectl apply -f "${K8S_DIR}/base/configmap.yaml"
kubectl apply -f "${K8S_DIR}/base/secrets.yaml"
kubectl apply -f "${K8S_DIR}/base/network-policy.yaml"
# Attempt to apply Ingress (may fail if controller is not ready)
kubectl apply -f "${K8S_DIR}/base/ingress.yaml" || print_warn "Ingress apply failed (likely webhook issue). Retrying later..."

# 4. Phase A: Deploying Infrastructure (Postgres, Redis, MinIO, Kafka)
print_info "Phase A: Deploying Infrastructure..."
kubectl apply -f "${K8S_DIR}/postgres/postgres-manifests.yaml"
kubectl apply -f "${K8S_DIR}/redis/redis-manifests.yaml"
kubectl apply -f "${K8S_DIR}/minio/minio-manifests.yaml"
kubectl apply -f "${K8S_DIR}/kafka/zookeeper.yaml"
kubectl apply -f "${K8S_DIR}/kafka/kafka.yaml"

print_info "Waiting for Infrastructure to settle (60s Nuclear Pause)..."
sleep 60

# Diagnostic Check
kubectl get nodes &> /dev/null || { print_error "Cluster died during Wave A!"; exit 1; }

print_info "Waiting for Infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l service=postgres -n $NAMESPACE --timeout=120s || print_warn "Postgres still starting..."
kubectl wait --for=condition=ready pod -l service=redis -n $NAMESPACE --timeout=120s || print_warn "Redis still starting..."
kubectl wait --for=condition=ready pod -l app=minio -n $NAMESPACE --timeout=120s || print_warn "MinIO still starting..."
kubectl wait --for=condition=ready pod -l app=zookeeper -n $NAMESPACE --timeout=120s || print_warn "Zookeeper still starting..."
kubectl wait --for=condition=ready pod -l app=kafka -n $NAMESPACE --timeout=120s || print_warn "Kafka still starting..."

# 4.5. Phase B: Deploying Monitoring Stack (Prometheus & Grafana)
print_info "Phase B: Deploying Monitoring Stack..."
kubectl apply -f "${K8S_DIR}/monitoring/grafana-dashboards.yaml"
kubectl apply -f "${K8S_DIR}/monitoring/prometheus-manifests.yaml"
kubectl apply -f "${K8S_DIR}/monitoring/grafana-manifests.yaml"

print_info "Waiting for Monitoring to settle (60s Nuclear Pause)..."
sleep 60

# Diagnostic Check
kubectl get nodes &> /dev/null || { print_error "Cluster died during Wave B!"; exit 1; }

print_info "Waiting for Monitoring Stack to be ready..."
kubectl wait --for=condition=ready pod -l app=prometheus -n $NAMESPACE --timeout=120s || print_warn "Prometheus still starting..."
kubectl wait --for=condition=ready pod -l app=grafana -n $NAMESPACE --timeout=120s || print_warn "Grafana still starting..."

# 5. Phase C: Deploying Application (Migrations, API, Worker)
print_info "Phase C: Deploying Application..."
print_info "Running database migrations..."
# Delete old migration job if exists
kubectl delete job db-migration -n $NAMESPACE --ignore-not-found
# Create and run migration job
kubectl apply -f "${K8S_DIR}/base/migration-job.yaml"
print_info "Waiting for migrations to complete..."
kubectl wait --for=condition=complete job/db-migration -n $NAMESPACE --timeout=120s || print_warn "Migration job still running..."

# 6. Apply App Services (API, Worker) - Use Service DNS names from ConfigMap
print_info "Deploying Application Services..."

kubectl apply -f "${K8S_DIR}/api/api-manifests.yaml"
# kubectl apply -f "${K8S_DIR}/api/api-hpa.yaml" (Skipped for local stability)
kubectl apply -f "${K8S_DIR}/worker/worker-manifests.yaml"

# 7. Optional KEDA Scaling
if kubectl api-resources | grep -q "scaledobjects"; then
    print_info "Applying KEDA scaling for workers..."
    kubectl apply -f "${K8S_DIR}/worker/worker-keda.yaml"
else
    print_warn "KEDA not found in cluster. Skipping auto-scaling (ScaledObject)."
fi

print_info "Waiting for Deployments to be available..."
kubectl rollout status deployment/api-deployment -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/worker-deployment -n $NAMESPACE --timeout=300s

# 8. Setup /etc/hosts entries for local domains (Context-Aware)
# 8. Setup /etc/hosts entries for local domains (Context-Aware)
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

setup_hosts

# 9. Health Verification
if [ "$SKIP_VERIFY" = false ]; then
    print_info "Verifying cluster connectivity..."
    if ! wait_for_cluster_ready; then
        print_error "Cluster unreachable! (connection refused after retries). Please check Docker Desktop health."
        exit 1
    fi

    print_info "Verifying deployment health at http://api.local..."
    HEALTH_KEY=$(kubectl get secret app-secrets -n $NAMESPACE -o jsonpath='{.data.HEALTH_CHECK_SECRET}' | base64 -d)
    
    for i in {1..5}; do
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Health-Key: $HEALTH_KEY" http://api.local/api/v1/health/ready || echo "failed")
        
        if [ "$HEALTH_STATUS" = "200" ]; then
            print_info "✅ API is Healthy and Ready (via Ingress)"
            break
        else
            print_warn "Waiting for Ingress readiness... ($i/5) status: $HEALTH_STATUS"
            sleep 5
        fi
    done
fi



print_info "=== Deployment Complete ==="
print_info ""
print_info "🎯 Your Application Endpoints:"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info ""
print_info "📡 API Endpoints (via Ingress):"
print_info "   • Login:    http://api.local/api/v1/auth/login"
print_info "   • Register: http://api.local/api/v1/auth/register"
print_info "   • Users:    http://api.local/api/v1/users"
print_info "   • Health:   http://api.local/api/v1/health/live"
print_info ""
print_info "🎨 Admin UI:"
print_info "   • Dashboard: http://api.local/admin/"
print_info ""
print_info "🔮 GraphQL Endpoint:"
print_info "   • URL: http://localhost:8080/graphql"
print_info "   • URL: http://api.local/graphql"
print_info ""
print_info "💾 Storage:"
print_info "   • Console: http://minio.local (minioadmin/minioadmin)"
print_info "   • Files:   http://api.local/express-nest-blueprint/..."
print_info ""
print_info "📊 Monitoring & Metrics:"
print_info "   • Grafana:    http://grafana.local (admin/admin)"
print_info "   • Prometheus: http://prometheus.local"
print_info "   • Metrics:    http://api.local/api/v1/metrics"
print_info ""
print_info "🔧 Access Mode:"
print_info "   • Pure Ingress (No tunnels needed)"
print_info "   • Port 80 based (Professional Domain Access)"
print_info ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$KEEP_PORT_FORWARD" = false ]; then
    print_warn "⚠️  Port-forwards will close when script finishes. Use --keep-port-forward to keep them alive."
else
    print_info "✅ Port-forwards running in background"
fi

print_info ""
print_info "💡 Quick Test:"
print_info "   curl http://api.local/api/v1/health/live -H 'X-Health-Key: your_super_secret_jwt_key'"
print_info ""
