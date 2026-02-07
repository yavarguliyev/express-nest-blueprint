# Infrastructure Directory

Automated deployment and orchestration for Express Nest Blueprint.

## Directory Structure

```
infrastructure/
├── jenkins/              # Jenkins CI/CD server (fully automated)
│   ├── casc.yaml        # Configuration as Code
│   └── ...scripts
├── deployments/          # Environment-specific deployments
│   ├── dev/             # Development environment (Docker Compose)
│   ├── prod/            # Production environment (Docker Compose)
│   └── infra/           # Local Kubernetes environment (Unified)
├── common/              # Shared assets
│   ├── scripts/         # Base utility scripts (infra-common.sh)
│   ├── tests/           # Stress and maintenance tests
│   ├── config/          # Service configurations (monitoring, DB)
│   └── docker-config/   # Docker bootstrap scripts
├── secrets/             # Environment templates
└── dev@tmp/             # Local dev data (gitignored)
```

## Quick Start

### 1. Start Jenkins (Zero Configuration Required!)

```bash
cd packages/infrastructure/jenkins
bash start.sh
```

Then open http://localhost:8080 and login with:
- **Username**: `admin`
- **Password**: `admin123`

You'll immediately see 3 pre-configured deployment jobs:
- 🚀 **Dev Environment**
- 🏭 **Prod Environment**  
- 🏗️ **Infrastructure (K8s)**

### 2. Deploy an Environment

**Option A: Via Jenkins UI**
1. Click on any deployment job
2. Click "Build with Parameters"
3. Select action: `deploy`, `restart`, `stop`, or `remove`
4. Click "Build"

**Option B: Via Command Line**
```bash
# Development
cd deployments/dev
bash start.sh      # Deploy
bash restart.sh    # Restart
bash stop.sh       # Stop
bash remove.sh     # Remove

# Production
cd deployments/prod
bash start.sh      # Deploy
bash restart.sh    # Restart
bash stop.sh       # Stop
bash remove.sh     # Remove

# Infrastructure # Infrastructure (K8s) Kubernetes Deployment
cd deployments/infra/scripts
bash start.sh      # Deploy (Minimal)
bash deploy.sh     # Deploy (Professional Automation)
bash restart.sh    # Restart
bash stop.sh       # Stop
bash remove.sh     # Remove (Minimal)
bash clean.sh      # Remove (Professional Purge)
```

## Environment Variables

All environments use `.env` files for configuration. Templates are provided in `secrets/`:

```bash
# Setup dev environment
cp secrets/.env.dev.template deployments/dev/.env
# Edit deployments/dev/.env with your values

# Setup prod environment
cp secrets/.env.prod.template deployments/prod/.env
# Edit deployments/prod/.env with STRONG production credentials
```

**Security Note**: `.env` files are gitignored. Never commit actual credentials!

## Jenkins Features

- ✅ **Zero Manual Configuration** - Jobs are pre-created via Configuration as Code
- ✅ **Parameterized Builds** - Select deploy/restart/stop/remove actions
- ✅ **Production Safety** - Confirmation required for prod deployments
- ✅ **Real-time Logs** - Watch deployment progress in console output
- ✅ **Persistent Data** - Jenkins data survives container restarts

## Lifecycle Management

All environments support the same operations:

| Script | Description |
|--------|-------------|
| `start.sh` | Deploy/start the environment |
| `stop.sh` | Stop services (preserves data) |
| `restart.sh` | Stop then start (quick reload) |
| `remove.sh` | Destroy everything (requires confirmation) |

## Best Practices

1. **Use Jenkins for automation** - Consistent deployments across all environments
2. **Keep secrets secure** - Use templates, never commit `.env` files
3. **Test in dev first** - Always validate changes before prod
4. **Monitor logs** - Check Jenkins console output for issues
5. **Backup prod data** - Before running `remove.sh` on production

# 🏗️ Infrastructure & Kubernetes Deployment

Professional automation suite for deploying and managing the application on Kubernetes.

## 🚀 Automation Scripts

### `deploy.sh`
The main deployment script that automates everything from building images to setting up local tunnels.

**Full Automation Command (Recommended for first run):**
```bash
./deploy.sh --install-ingress --keep-port-forward
```

**Usage:**
```bash
cd deployments/infra/scripts
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
cd deployments/infra/scripts
./clean.sh
```

## 📍 Direct Access
The deploy script is designed to point to professional domains. Ensure you have mapped them:
- **API & Admin Panel**: [http://api.local](http://api.local)
- **Grafana Dashboards**: [http://grafana.local](http://grafana.local)
- **Prometheus UI**: [http://prometheus.local](http://prometheus.local)

## 📡 Ingress Networking
If you want to use the professional domain `api.local`, ensure you:
1. Run `./deploy.sh --install-ingress` once.
2. Add `127.0.0.1 api.local` to your `/etc/hosts`.

## 📈 Scalability
The API is configured with **Horizontal Pod Autoscaling (HPA)**. It will automatically scale between 3 and 10 replicas based on CPU/Memory pressure.
