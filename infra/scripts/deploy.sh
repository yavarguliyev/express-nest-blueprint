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

# Terminate existing port-forwarding
if [ -f "$PORT_FORWARD_PID_FILE" ]; then
    PID=$(cat "$PORT_FORWARD_PID_FILE")
    if ps -p "$PID" > /dev/null; then
        print_info "Terminating existing port-forward (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
    fi
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
    cd ../.. && docker build -t $IMAGE_NAME . && cd infra/scripts
else
    print_info "Skipping Docker build..."
fi

# 3. Create Namespace and Apply Base Config (ConfigMap, Secrets, Ingress)
print_info "Creating namespace..."
kubectl apply -f ../k8s/base/namespace.yaml

print_info "Applying base configurations..."
kubectl apply -f ../k8s/base/configmap.yaml
kubectl apply -f ../k8s/base/secrets.yaml
kubectl apply -f ../k8s/base/network-policy.yaml
# Attempt to apply Ingress (may fail if controller is not ready)
kubectl apply -f ../k8s/base/ingress.yaml || print_warn "Ingress apply failed (likely webhook issue). Retrying later..."

# 4. Apply Infrastructure (Postgres, Redis, MinIO)
print_info "Deploying Infrastructure (Postgres, Redis & MinIO)..."
kubectl apply -f ../k8s/postgres/postgres-manifests.yaml
kubectl apply -f ../k8s/redis/redis-manifests.yaml
kubectl apply -f ../k8s/minio/minio-manifests.yaml

print_info "Waiting for Infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l service=postgres -n $NAMESPACE --timeout=180s || print_warn "Postgres still starting..."
kubectl wait --for=condition=ready pod -l service=redis -n $NAMESPACE --timeout=180s || print_warn "Redis still starting..."
kubectl wait --for=condition=ready pod -l app=minio -n $NAMESPACE --timeout=180s || print_warn "MinIO still starting..."

# 5. Dynamic IP Injection Workaround
POSTGRES_POD_IP=$(kubectl get pods -l service=postgres -n $NAMESPACE -o jsonpath='{.items[0].status.podIP}')
REDIS_POD_IP=$(kubectl get pods -l service=redis -n $NAMESPACE -o jsonpath='{.items[0].status.podIP}')
print_info "Injecting direct IPs: PG=$POSTGRES_POD_IP, Redis=$REDIS_POD_IP"

# 6. Apply App Services (API, Worker, HPA) with Direct IPs
print_info "Preparing and Deploying Application Services..."

# Create temporary manifests with injected IPs to avoid double rollouts
API_MANIFEST=$(mktemp)
WORKER_MANIFEST=$(mktemp)

# Use a different delimiter for sed since IPs contain dots
sed "s|value: \"API\"|value: \"API\"\n        - name: DB_HOST\n          value: \"$POSTGRES_POD_IP\"\n        - name: REDIS_HOST\n          value: \"$REDIS_POD_IP\"|g" ../k8s/api/api-manifests.yaml > "$API_MANIFEST"
sed "s|value: \"WORKER\"|value: \"WORKER\"\n        - name: DB_HOST\n          value: \"$POSTGRES_POD_IP\"\n        - name: REDIS_HOST\n          value: \"$REDIS_POD_IP\"|g" ../k8s/worker/worker-manifests.yaml > "$WORKER_MANIFEST"

kubectl apply -f "$API_MANIFEST"
kubectl apply -f ../k8s/api/api-hpa.yaml
kubectl apply -f "$WORKER_MANIFEST"

# 6.1 Optional KEDA Scaling
if kubectl api-resources | grep -q "scaledobjects"; then
    print_info "Applying KEDA scaling for workers..."
    kubectl apply -f ../k8s/worker/worker-keda.yaml
else
    print_warn "KEDA not found in cluster. Skipping auto-scaling (ScaledObject)."
fi

rm "$API_MANIFEST" "$WORKER_MANIFEST"

print_info "Waiting for Deployments to be available..."
kubectl rollout status deployment/api-deployment -n $NAMESPACE --timeout=120s
kubectl rollout status deployment/worker-deployment -n $NAMESPACE --timeout=120s

# 7. Deploy Admin UI
print_info "Deploying Admin UI..."
kubectl apply -f ../k8s/admin/admin-manifests.yaml
kubectl rollout status deployment/admin-ui-deployment -n $NAMESPACE --timeout=120s

# 8. Setup Port-Forwarding (Automated & Verified)
print_info "Setting up local tunnel (localhost:8080 -> admin-ui-service:80)..."
# Kill any stray port-forwarding on 8080 just in case PID file was missing
lsof -i :8080 -t | xargs kill -9 2>/dev/null || true

kubectl port-forward svc/admin-ui-service 8080:80 -n $NAMESPACE > /dev/null 2>&1 &
PF_PID=$!
echo $PF_PID > "$PORT_FORWARD_PID_FILE"

# Wait for tunnel to be active
MAX_RETRIES=10
for i in $(seq 1 $MAX_RETRIES); do
    if lsof -i :8080 > /dev/null 2>&1 || nc -z localhost 8080 > /dev/null 2>&1; then
        print_info "Port-forwarding successfully established (PID: $PF_PID)"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        print_error "Failed to establish port-forwarding tunnel."
    fi
    sleep 1
done

# 8. Health Verification
if [ "$SKIP_VERIFY" = false ]; then
    print_info "Verifying deployment health..."
    for i in {1..5}; do
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health/ready || echo "failed")
        if [ "$HEALTH_STATUS" = "200" ]; then
            print_info "✅ API is Healthy and Ready at http://localhost:8080/health/ready"
            break
        else
            print_warn "Waiting for API readiness... ($i/5) status: $HEALTH_STATUS"
            sleep 5
        fi
    done
fi

print_info "=== Deployment Complete ==="
print_info "📍 API: http://localhost:8080/auth/register"
print_info "📍 API (Ingress): http://api.local (Requires /etc/hosts entry)"

if [ "$KEEP_PORT_FORWARD" = false ]; then
    print_warn "Note: Tunnel will close when script finishes. Use --keep-port-forward to keep it alive."
else
    print_info "Tunnel left running in background (PID: $PF_PID)."
fi
