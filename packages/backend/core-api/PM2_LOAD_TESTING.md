# PM2 Cluster & Load Testing Guide

## 🚀 PM2 Cluster Mode

### Quick Start

```bash
# Build the application first
npm run build -w @app/core-api

# Start in cluster mode (uses all CPU cores)
npm run pm2:start -w @app/core-api

# Check status
npm run pm2:status -w @app/core-api

# View logs
npm run pm2:logs -w @app/core-api

# Monitor in real-time
npm run pm2:monit -w @app/core-api
```

### Available PM2 Commands

| Command | Description |
|---------|-------------|
| `npm run pm2:start` | Start app in cluster mode (max instances) |
| `npm run pm2:stop` | Stop all instances |
| `npm run pm2:restart` | Restart all instances (with downtime) |
| `npm run pm2:reload` | Zero-downtime reload |
| `npm run pm2:delete` | Remove app from PM2 |
| `npm run pm2:logs` | View application logs |
| `npm run pm2:monit` | Real-time monitoring dashboard |
| `npm run pm2:status` | Check pm2 process status |
| `npm run pm2:flush` | Clear all log files |
| `npm run pm2:kill` | Kill PM2 daemon (stops everything) |

### Configuration

PM2 configuration is in `ecosystem.config.json`:

```json
{
  "apps": [{
    "name": "express-nest-api",
    "script": "./dist/main.js",
    "instances": "max",           // Uses all CPU cores
    "exec_mode": "cluster",       // Cluster mode
    "max_memory_restart": "500M", // Restart if memory exceeds 500MB
    "autorestart": true,          // Auto-restart on crash
    "max_restarts": 10            // Max restart attempts
  }]
}
```

### Shutdown Process

```bash
# Graceful stop (recommended)
npm run pm2:stop -w @app/core-api

# Or forceful kill of all PM2 processes
npm run pm2:kill -w @app/core-api
```

## ⚡ Load Testing with Autocannon

### Quick Test

```bash
# Show available tests
npm run load-test -w @app/core-api

# Run specific test
npm run load-test:auth-login -w @app/core-api

# Or use the script directly
cd packages/backend/core-api
bash load-test.sh auth-login
```

### Available Load Tests

#### Authentication
- `load-test:auth-login` - Login endpoint
- `load-test:auth-register` - Registration endpoint

#### Users
- `load-test:users-list` - List all users

#### Admin
- `load-test:admin-bulk` - Bulk operations endpoint

#### Health
- `load-test:health` - Health check endpoint

### Manual Autocannon Commands

#### Example 1: Login Endpoint
```bash
autocannon \
  --workers 4 \
  -c 10 \
  -d 30 \
  --renderStatusCodes \
  --renderLatencyTable \
  -m POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -b '{
    "email": "guliyev.yavar@example.com",
    "password": "Admin@12345"
  }' \
  http://127.0.0.1:3000/api/v1/auth/login
```

#### Example 2: Bulk Operations (with Auth)
```bash
# First, get a JWT token by logging in
TOKEN="YOUR_JWT_TOKEN_HERE"

autocannon \
  --workers 4 \
  -c 10 \
  -d 30 \
  --renderStatusCodes \
  --renderLatencyTable \
  -m POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -b '{
    "operations": [
      {"type":"update","table":"users","category":"Database Management","recordId":3,"data":{"isActive":false}},
      {"type":"update","table":"users","category":"Database Management","recordId":4,"data":{"isActive":false}},
      {"type":"update","table":"users","category":"Database Management","recordId":5,"data":{"isActive":true}}
    ]
  }' \
  http://127.0.0.1:3000/api/v1/admin/bulk-operations
```

#### Example 3: GET Request with Headers
```bash
autocannon \
  --workers 4 \
  -c 10 \
  -d 30 \
  --renderStatusCodes \
  --renderLatencyTable \
  -m GET \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://127.0.0.1:3000/api/v1/users
```

#### Example 4: Health Check (no auth)
```bash
autocannon \
  --workers 4 \
  -c 10 \
  -d 30 \
  --renderStatusCodes \
  --renderLatencyTable \
  -m GET \
  -H "X-Health-Key: your_super_secret_jwt_key" \
  http://127.0.0.1:3000/api/v1/health/ready
```

### Autocannon Options Explained

| Flag | Description | Example |
|------|-------------|---------|
| `--workers` | Number of worker threads | `--workers 4` |
| `-c` | Number of concurrent connections | `-c 10` |
| `-d` | Duration in seconds | `-d 30` |
| `-m` | HTTP method | `-m POST` |
| `-H` | HTTP header | `-H "Content-Type: application/json"` |
| `-b` | Request body (JSON) | `-b '{"key":"value"}'` |
| `--renderStatusCodes` | Show status code distribution | |
| `--renderLatencyTable` | Show latency percentiles | |

### Customizing Load Tests

Edit `packages/backend/core-api/load-test.sh` to:

1. **Change base configuration**:
```bash
BASE_URL="http://127.0.0.1:3000"
DURATION=30        # Test duration in seconds
CONNECTIONS=10     # Concurrent connections
WORKERS=4          # Worker threads
```

2. **Add new test cases**:
```bash
your-endpoint)
    print_info "Testing: Your Custom Endpoint"
    run_test "POST" "/api/v1/your/endpoint" \
        '-H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN"' \
        '{"your":"data"}'
    ;;
```

## 📊 Interpreting Results

Autocannon output shows:

- **Requests/sec**: Throughput (higher is better)
- **Latency**: Response time distribution
  - `Avg`: Average latency
  - `p50`: 50th percentile (median)
  - `p99`: 99th percentile (worst case for most requests)
- **Status codes**: HTTP response distribution
- **Errors**: Failed requests

### Example Output
```
Running 30s test @ http://127.0.0.1:3000/api/v1/health/ready
10 connections

┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max    │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼────────┤
│ Latency │ 2 ms │ 3 ms │ 10 ms │ 15ms │ 4.23 ms │ 2.11 ms │ 50 ms  │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴────────┘

Req/Sec : 2500
Req/Bytes: 1 GB
```

## 🎯 Best Practices

### Before Load Testing

1. **Build the app**: `npm run build -w @app/core-api`
2. **Start PM2 cluster**: `npm run pm2:start -w @app/core-api`
3. **Verify it's running**: `npm run pm2:status -w @app/core-api`
4. **Get JWT tokens**: Login first to get valid tokens for protected endpoints

### During Testing

1. **Monitor system resources**: Use `npm run pm2:monit`
2. **Check logs**: `npm run pm2:logs` in another terminal
3. **Start small**: Begin with low connections, then increase

### After Testing

1. **Review metrics**: Check latency, throughput, error rate
2. **Scale if needed**: Adjust PM2 instances in `ecosystem.config.json`
3. **Stop when done**: `npm run pm2:stop -w @app/core-api`

## 🔧 Troubleshooting

### PM2 won't start
```bash
# Kill and restart PM2 daemon
npm run pm2:kill -w @app/core-api
npm run pm2:start -w @app/core-api
```

### High memory usage
- Reduce `instances` in `ecosystem.config.json`
- Lower `max_memory_restart` threshold

### Load test fails
- Check if app is running: `npm run pm2:status`
- Verify endpoint URL is correct
- For auth endpoints, ensure valid JWT token
- Check request body format (must be valid JSON)

### Connection refused
- Ensure app is running on port 3000
- Check if another process is using the port: `lsof -i :3000`

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Autocannon Documentation](https://github.com/mcollina/autocannon)
- [Node.js Cluster Module](https://nodejs.org/api/cluster.html)
