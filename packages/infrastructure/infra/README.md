# 🏗️ Infrastructure & Kubernetes Deployment

Professional automation suite for deploying and managing the application on Kubernetes.

## 📂 Directory Structure

- `k8s/`: Kubernetes manifest files organized by component.
  - `base/`: Core configs (ConfigMaps, Secrets, Ingress).
  - `api/`: API service deployment, service, and HPA.
  - `worker/`: Background worker deployment.
  - `postgres/`: Database deployment and service.
  - `redis/`: Cache/Queue deployment and service.
- `scripts/`: Professional automation scripts.

## 🚀 Automation Scripts

### `deploy.sh`
The main deployment script that automates everything from building images to setting up local tunnels.

**Full Automation Command (Recommended for first run):**
```bash
./deploy.sh --install-ingress --keep-port-forward
```

**Usage:**
```bash
cd infra/scripts
./deploy.sh [FLAGS]
```

**Available Flags:**
- `--install-ingress`: Re-installs NGINX Ingress Controller (fixes webhook errors).
- `--skip-build`: Skips the Docker image build step.
- `--no-verify`: Skips the automated health check at the end.
- `--keep-port-forward`: Leaves the port-forward tunnel running in the background.

### `clean.sh`
Completely wipes the Kubernetes environment and kills active tunnels.

**Usage:**
```bash
./clean.sh
```

## 📍 Direct Access
The deploy script automatically maps `localhost:8080` to the internal API service. You can test immediately at:
[http://localhost:8080/api/v1/users](http://localhost:8080/api/v1/users)

## 📡 Ingress Networking
If you want to use the professional domain `api.local`, ensure you:
1. Run `./deploy.sh --install-ingress` once.
2. Add `127.0.0.1 api.local` to your `/etc/hosts`.

## 📈 Scalability
The API is configured with **Horizontal Pod Autoscaling (HPA)**. It will automatically scale between 3 and 10 replicas based on CPU/Memory pressure.
