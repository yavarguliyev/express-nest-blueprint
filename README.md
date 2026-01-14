# Express.js Application in Nest-Style Architecture

##### A cutting-edge Node.js backend built with Express.js, transformed into a robust, Nest-style architecture. This project features a custom Dependency Injection (DI) system, modular design, and a powerful computation offloading engine using BullMQ to handle heavy workloads seamlessly in the background.

---

# 📖 Table of Contents

1. [Features](#-features)
2. [Architecture Overview](#-architecture-overview)
3. [Internal Flow and Architecture](#-internal-flow-and-architecture)
4. [Key Technical Features](#-key-technical-features)
5. [Design Patterns](#-design-patterns)
6. [Principles](#-principles)
7. [Technologies](#-technologies)
8. [Getting Started](#-getting-started)
9. [Project Structure](#-project-structure)
10. [API Documentation](#-api-documentation)
11. [Running the Application](#-running-the-application)
12. [Usage](#-usage)
13. [Health Monitoring](#-health-monitoring)
14. [Local-to-Cloud Migration](#-local-to-cloud-migration)
15. [Testing & Validation](#-testing--validation)
17. [Enterprise Orchestration (Kubernetes)](#-enterprise-orchestration-kubernetes)
18. [Observability (Prometheus)](#-observability-prometheus)
19. [Contributing](#-contributing)
20. [License](#-license)

---

# ✨ Features

## User Management & Auth
* **Complete User CRUD Lifecycle**
  * Advanced user registration and profile management.
  * Integration with persistent PostgreSQL storage.
  * Validation using `class-validator` for data integrity.
* **Authentication & Security**
  * Secure JWT-based authentication.
  * Password hashing and role-based access control (RBAC).

## Computation Offloading (@Compute)
* **Transparent Task Delegation**
  * Simply annotate any service method with `@Compute()` to offload it to background workers.
  * Handles both "Wait-for-result" and "Fire-and-forget" (background) modes.
* **Intelligent Worker Spawning**
  * The API process automatically spawns and manages a pool of child worker processes.
  * Configurable min/max worker counts via environment variables.

## System Resilience
* **Lazy Initialization Pattern**
  * A strictly ordered, awaited startup sequence ensuring all dependencies (DB, Redis, Logger) are ready before the app accepts traffic.
* **Universal Graceful Shutdown**
  * Centralized lifecycle management for clean disconnection of DB, Redis, and child processes on termination signals.
* **Circuit Breaker Pattern**
  * Automatic failure detection and temporary service isolation (e.g., Database) to prevent cascading failures.
* **Port Reliability (Search & Destroy)**
  * Self-healing development environment ensuring deterministic startup by strictly eliminating zombie processes.
* **Enterprise Resilience**
  * **Database Read/Write Splitting**: Automatic redirection of traffic (Reads to Replicas, Writes to Primary).
  * **Transactional Integrity**: Robust `transactionWithRetry` implementation to handle deadlocks and serialization conflicts at 1M+ request scale.

---

# 🏗 Architecture Overview

![Architectural Overview](./image/architectural-overview.png)

---

#### This application bridges the simplicity of Express.js with the structured power of NestJS. Each core business function is isolated into a dedicated Module, promoting high cohesion and low coupling.

* **Nest-Style Modules**: Features are encapsulated in Modules (`UsersModule`, `AuthModule`, `ComputeModule`) that manage their own providers and exports.
* **Custom DI Container**: A bespoke Dependency Injection system with handler-based resolution, singleton management, and factory providers.
* **Intelligent Dependency Management**: Automated circular dependency prevention using leaf-level constants and type-only imports.
* **Process Separation**: Clear distinction between API (Request Handling) and Worker (Computation) roles within the same codebase.
* **Queue-Driven Offloading**: Uses BullMQ and Redis as the backbone for reliable, asynchronous processing.

---

# 🧩🔄⚙️🌐 Internal Flow and Architecture

## 1. Request Layer
* Incoming requests flow through global middleware (Logging, Rate Limiting) into specialized **Controllers**.
* Handlers use decorators like `@Get`, `@Post`, and `@Param` for clear route definitions.

## 2. Business Logic (Services)
* Services contain the core domain logic.
* Methods requiring heavy processing are transparently offloaded to background workers using the `@Compute` proxy.

## 3. Infrastructure Layer
* **DatabaseService**: Manages PostgreSQL connections.
* **Redis/BullMQ**: Handles the transport layer for offloaded jobs.
* **LifecycleModule**: Coordinates system-wide startup and shutdown.

---

# ⚙️ Key Technical Features

* **Custom Decorators**: Support for `@Injectable`, `@Module`, `@Inject`, and `@Compute`.
* **Centralized Logging**: Structured, console-based logging with diagnostic prefixes.
* **Strict Role detection**: Automatic role assignment for parent and child processes.
* **Rate Limiting (Throttling)**: Intelligent request limiting based on IP and User ID, secured by Redis.
* **Error Handling**: Standardized Exception Filters and BadRequest/NotFound exception classes.

---

# 🧩⚙️🛠️📐 Design Patterns

## 1. Singleton Pattern
* Ensures a single instance of the DI Container, Database services, and Logger.

## 2. Dependency Injection (DI)
* Decouples components by injecting dependencies at runtime, facilitating unit testing and modularity.

## 3. Proxy Pattern
* Used by the `ComputeExplorer` to intercept method calls and redirect them to the BullMQ queue.

## 4. Repository Pattern
* Abstracts database queries behind a clean interface (`UsersRepository`), separating domain logic from persistence logic.

## 5. Decorator Pattern
* Extensively used for metadata tagging (`@Module`, `@Injectable`) and runtime behavior modification (`@Compute`).

## 6. Factory Pattern
* Implemented in module providers to handle complex instance creation with dependencies.

## 7. Caching Decorator Pattern
* Enhances performance by caching method results in Redis.
* Simple `@Cache()` annotation for transparent result persistence.

## 8. Strategy Pattern (Storage)
* Universal storage interface for S3, MinIO, and local filesystem.
* Easily switchable strategies without changing domain logic.

## 9. Circuit Breaker Pattern
* Prevents the application from repeatedly trying to execute an operation that's likely to fail.
* Wraps external calls (Database, Redis) to fail fast and recover gracefully.

## 10. Migration Strategy Pattern
* Decouples schema evolution from code deployments using versioned migration files.
* **Essential Configuration**: Uses `database.json` to map system environment variables for seamless local-to-cloud schema synchronization.

---

# 📏🧭💡⚖️ Principles

* **SOLID**: Strict adherence to all five principles, especially Single Responsibility and Dependency Inversion.
* **DRY (Don't Repeat Yourself)**: Shared utilities for validation, error handling, and helpers.
* **KISS (Keep It Simple, Stupid)**: Maintaining the lean nature of Express while gaining the benefits of Nest architecture.

---

# 💻 Technologies

* **Node.js** - Runtime environment.
* **TypeScript** - For type safety and advanced OOP patterns.
* **Express.js** - Lightweight and flexible web framework.
* **BullMQ** - Message queue for background processing.
* **Redis** - High-performance data store for queues and caching.
* **PostgreSQL** - Relational database for persistence.
* **Reflect-Metadata** - Powering the custom decorator and DI system.

---

# 🚀 Getting Started

## 1. Prerequisites
* ✅ Node.js (v20.x or higher)
* ✅ Docker & Docker Compose
* ✅ PostgreSQL & Redis (if running locally)

## 2. Infrastructure Setup (Docker)
This project uses Docker to manage infrastructure services (Redis and PostgreSQL) with **automated database initialization**.

```bash
# Navigate to the deployment folder
cd deployment/dev

# Start the infrastructure (PostgreSQL & Redis)
# This will automatically run database/schema.sql on first launch
bash start.sh
```

### Infrastructure Management Scripts:
- `bash start.sh`: Boots up the containers and runs migrations automatically.
- `bash stop.sh`: Safely stops the infrastructure.
- `bash remove.sh`: Wipes containers and volumes (useful for a fresh database state).

## 3. Application Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run the app (API mode)
npm run dev
```

---

# 📂 Project Structure

```bash
/src
  ├── /common         # Shared decorators, exceptions, interfaces, and helpers
  ├── /core           # Core modules (Database, Compute, Lifecycle, Config)
  ├── /modules        # Feature modules (Users, Auth)
  ├── /shared         # SharedModule for global services and initializers
  ├── app.module.ts   # Root application module
  └── main.ts         # Application entry point
```

---

# 📚 API Documentation

* **Users Endpoints**:
  * `GET /users`: List users (Paginated & Filterable)
  * `GET /users/:id`: Get user details
  * `POST /users`: Create user
  * `PATCH /users/:id`: Update user
  * `DELETE /users/:id`: Delete user

* **Auth Endpoints**:
  * `POST /auth/login`: Authenticate and receive JWT

---

# 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm run start
```

---

# 🛠 Usage

### Example: Computation Offloading
Simply add the decorator to any async method:

```typescript
@Compute({ priority: 1, attempts: 2 })
async heavyTask(data: unknown) {
  // This will automatically run in a background worker!
  await performIntensiveCalculation(data);
}
```

---

### Example: Global Caching
Add `@Cache` to any service method to cache results:

```typescript
@Cache({ ttl: 3600 })
async getExpensiveData() {
  return await this.repo.findVeryHeavyData();
}
```

---

### Example: Storage Abstraction
Inject `StorageService` to handle file operations regardless of provider:

```typescript
constructor(private readonly storageService: StorageService) {}

async uploadAvatar(file: Buffer) {
  await this.storageService.upload('avatars/user-1.png', file);
}
```

---

# 🏥 Health Monitoring

The application includes a built-in health check system to monitor the pulse of all infrastructure components.

### Endpoints
*   **Liveness (`/health/live`)**: Shallow check to ensure the process is responsive.
*   **Readiness (`/health/ready`)**: Deep check verifying connectivity to PostgreSQL and Redis.
*   **Legacy Health (`/health`)**: General status overview.

### Monitored Components:
* **PostgreSQL**: Real-time connection status.
* **Redis**: Live connectivity check via `PING`.
* **BullMQ Queues**: Dynamic job counts (active, waiting, failed, etc.).
* **Compute Workers**: State reporting (running/stopped), pending job counts, and registered handlers.

---

# ☁️ Local-to-Cloud Migration

This project is bridge-ready for cloud deployment. Follow this guide to migrate from the local Docker environment to enterprise cloud services.

### 1. Database (RDS / Managed Postgres)
* **Local**: Uses `deployment/db/init.sql`.
* **Migration**:
  * Point `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to your managed database instance.
  * For AWS RDS, ensure the Security Group allows traffic on port 5432 from the API process.

### 2. Caching & Queues (ElastiCache / Managed Redis)
* **Local**: Single Redis container.
* **Migration**:
  * Update `REDIS_HOST` and `REDIS_PORT`.
  * For production, ensure `REDIS_PASSWORD` is set.
  * The BullMQ and Cache modules will automatically adapt to the new connection.

### 3. Computation Assets (EC2 / ECS / Kubernetes)
* **Role Separation**:
  * Deploy the same codebase but control behavior via `COMPUTE_APP_ROLE`.
  * **API Process**: Set `COMPUTE_APP_ROLE=api` (Default). This process handles HTTP requests.
  * **Worker Process**: Set `COMPUTE_APP_ROLE=worker`. This process polls BullMQ and executes heavy tasks.
* **Scaling**: You can scale workers independently of the API based on queue depth (monitored via `/health`).

### 4. Storage (AWS S3)
* **Local**: Mocked or local filesystem.
* **Migration**:
  * Set `STORAGE_STRATEGY=s3`.
  * Provide `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, and `STORAGE_BUCKET_NAME`.
  * `StorageService` will transparently switch from local disk to S3 without code changes.

---

# � Testing & Validation

The project includes specialized scripts to validate system performance and protection mechanisms.

### 🛡️ Rate Limiting Test (Throttling)
Validates that the Redis-backed throttler correctly blocks excessive traffic.
```bash
# Sends 55 requests rapidly (Limit: 50/min)
node scripts/test-throttling.js
```
*   **Expected Outcome**: 50 successful requests (200 OK) followed by 5 blocked requests (**429 Too Many Requests**).

### ⚡ Stress Test (@Compute Offloading)
Simulates a high-concurrency scenario to verify parallel processing and API responsiveness.
```bash
# Authenticates and sends 5 concurrent heavy requests
node scripts/stress-test.js
```
*   **Validation**: 
    - Check terminal logs to see workers handling jobs in parallel.
    - Call `GET /health` during the test to see the BullMQ queue depth.

---

# ☸️ Enterprise Orchestration (Kubernetes)

> [!TIP]
> For deep-dive technical details on manifests, networking, and deployment logic, see the specialized [Infrastructure & K8s README](infra/README.md).

This project includes a professional-grade Kubernetes suite designed for enterprise scale.

### 1. Key Manifests (`infra/k8s`)
*   **API**: Scalable deployment with Horizontal Pod Autoscaler (HPA).
*   **Worker**: Headless background processors.
*   **PostgreSQL & Redis**: Isolated infrastructure pods.
*   **NetworkPolicies**: Restricts internal traffic (e.g., only API/Worker can talk to DB).

### 2. Automated Deployment
Use the professional automation suite to manage your cluster:

```bash
# Deploy everything (Base, DB, Redis, API, Worker)
# Automates: Docker builds, manifest application, IP injection, and port-forwarding
./infra/scripts/deploy.sh

# Clean everything
./infra/scripts/clean.sh
```

### 3. Production Hardening
*   **Structured Logging**: Winston JSON output enabled for cloud aggregation.
*   **Security**: Non-privileged containers and explicit network policies.
*   **Resilience**: Intelligent liveness/readiness probes with RateLimit bypass.

---

# 📊 Observability (Prometheus)

Deep visibility into application performance and system health.

### Usage
Prometheus metrics are exposed via a standard scraping endpoint:
```bash
curl http://localhost:3000/metrics
```

### Metrics Collected:
*   **HTTP Metrics**: Total request counts, latency histograms, and status code distribution (via `MetricsMiddleware`).
*   **Process Metrics**: CPU usage, memory heap stats, and garbage collection timing.
*   **Node.js Runtime**: Event loop lag and active handle counts.

---

# �🤝 Contributing
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

# 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
