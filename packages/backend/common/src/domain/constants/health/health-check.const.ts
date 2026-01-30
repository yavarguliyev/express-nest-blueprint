export const HEALTH_CHECKS = {
  DATABASE: { key: 'database', label: 'Database', usage: 'Database Usage', unit: 'MB', critical: true, alertThreshold: 5000 },
  REDIS: { key: 'redis', label: 'Redis', usage: 'Redis Usage', unit: 'MB', critical: true, alertThreshold: 1024 },
  QUEUES: { key: 'queues', label: 'Queues', usage: 'Queues Usage', unit: 'MB', critical: false, alertThreshold: 1000 },
  COMPUTE_WORKERS: {
    key: 'compute workers',
    label: 'Compute Workers',
    usage: 'Compute Workers Usage',
    unit: 'MB',
    critical: true,
    alertThreshold: 80
  },
  KAFKA_MESSA_PER_SEC: {
    key: 'kafka',
    label: 'Kafka Message Per Second',
    usage: 'Kafka Usage',
    unit: 'msg/s',
    critical: true,
    alertThreshold: 0.8
  },
  KAFKA_UNDER_REPLICATION: {
    key: 'kafka',
    label: 'Kafka Under Replication',
    usage: 'Kafka Under Replication Usage',
    unit: 'partitions',
    critical: true,
    alertThreshold: 0.8
  },
  S3_BUCKET_STORAGE: { key: 'storage', label: 'Storage', usage: 'S3 Bucket Usage', unit: 'MB', critical: true, alertThreshold: 50000 },
  CPU: { key: 'CPU', usage: 'CPU Usage', unit: 'seconds', critical: true, alertThreshold: 5 },
  MEMORY: { key: 'Memory', usage: 'Memory Usage', unit: 'MB', critical: true, alertThreshold: 500 }
} as const;

export const DASHBOARD_METRICS = {
  USERS: { name: 'Total Users', alertThreshold: null },
  CPU: { name: HEALTH_CHECKS.CPU.usage, alertThreshold: HEALTH_CHECKS.CPU.alertThreshold },
  MEMORY: { name: HEALTH_CHECKS.MEMORY.usage, alertThreshold: HEALTH_CHECKS.MEMORY.alertThreshold }
} as const;

export const ALERT_TEMPLATES = {
  THRESHOLD_EXCEEDED: {
    header: 'Recent Alerts',
    title: (metricName: string) => `${metricName} High`,
    message: (metricName: string, value: number, unit: string) => `${metricName} has exceeded its safe threshold (${value}${unit}).`,
    type: 'warning' as const
  },
  SYSTEM_STABLE: {
    header: 'Recent Alerts',
    title: 'System Stable',
    message: 'All core services are performing within normal parameters.',
    type: 'info' as const
  }
} as const;

export const CHART_DATA = {
  METRICS: {
    is_http_requests_total: 'http_requests_total',
    title: 'Requests by Status Code',
    name: 'Total HTTP Requests',
    type: ['counter', 'pie'],
    path_starts_with: '/api',
    label: ['path', 'status']
  },
  HISTOGRAM: {
    is_http_request_duration_seconds: 'http_request_duration_seconds',
    title: 'Request Duration Distribution',
    name: 'Total HTTP Requests',
    type: ['_bucket', 'bar', 'le', 'inf'],
    path_starts_with: '/api',
    label: []
  },
  CPU_USAGE: {
    is_process_cpu_user_seconds_total: 'process_cpu_user_seconds_total',
    title: 'CPU Usage',
    name: 'CPU Usage',
    type: ['%'],
    path_starts_with: '',
    label: []
  },
  MEMORY_USAGE: {
    is_nodejs_heap_size_used_bytes: 'nodejs_heap_size_used_bytes',
    title: 'Memory Usage',
    name: 'Memory Usage',
    type: ['MB'],
    path_starts_with: '',
    label: []
  }
} as const;
