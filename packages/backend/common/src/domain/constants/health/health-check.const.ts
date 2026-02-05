export const METRIC_CONFIG = {
  PREFIX: '',
  LABELS: {
    METHOD: 'method',
    PATH: 'path',
    STATUS: 'status',
    OPERATION: 'operation',
    RESULT: 'result',
    TOPIC: 'topic',
    GROUP: 'consumer_group',
    QUERY: 'query_type',
    TABLE: 'table',
    UNKNOWN: 'unknown',
    TIME_SUFFIX: 's'
  },
  NAMES: {
    HTTP_TOTAL: 'http_requests_total',
    HTTP_DURATION: 'http_request_duration_seconds',
    HTTP_ACTIVE: 'http_active_requests_total',
    CACHE_TOTAL: 'cache_operations_total',
    CACHE_RATIO: 'cache_hit_ratio',
    DB_DURATION: 'database_query_duration_seconds',
    DB_ACTIVE: 'database_connections_active',
    KAFKA_TOTAL: 'kafka_messages_processed_total',
    KAFKA_DURATION: 'kafka_message_processing_duration_seconds',
    S3_TOTAL: 's3_operations_total',
    S3_DURATION: 's3_operation_duration_seconds',
    FALLBACK_CPU: 'process_cpu_user_seconds_total',
    FALLBACK_MEM: 'process_resident_memory_bytes'
  },
  BUCKETS: {
    HTTP: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    DB: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    KAFKA: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    S3: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30]
  }
} as const;

export const HEALTH_CHECKS = {
  DATABASE: { key: 'database', label: 'Database', usage: 'Database Usage', unit: 'MB', critical: true, alertThreshold: 5000 },
  REDIS: { key: 'redis', label: 'Redis', usage: 'Redis Usage', unit: 'MB', critical: true, alertThreshold: 1024 },
  QUEUES: { key: 'queues', label: 'Queues', usage: 'Queues Usage', unit: 'items', critical: false, alertThreshold: 1000 },
  COMPUTE_WORKERS: {
    key: 'compute workers',
    label: 'Compute Workers',
    usage: 'Compute Workers Usage',
    unit: 'workers',
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
  CPU: { key: 'CPU', usage: 'CPU Usage', unit: '%', critical: true, alertThreshold: 5 },
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
    message: (metricName: string, value: number, unit: string) => `${metricName} has exceeded its safe threshold (${Number(value).toFixed(2)}${unit}).`,
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
    is_http_requests_total: METRIC_CONFIG.NAMES.HTTP_TOTAL,
    title: 'Requests by Status Code',
    name: 'Total HTTP Requests',
    type: ['counter', 'pie'],
    path_starts_with: '/api',
    label: [METRIC_CONFIG.LABELS.PATH, METRIC_CONFIG.LABELS.STATUS]
  },
  HISTOGRAM: {
    is_http_request_duration_seconds: METRIC_CONFIG.NAMES.HTTP_DURATION,
    title: 'Request Duration Distribution',
    name: 'histogram',
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
    is_nodejs_heap_size_used_bytes: 'process_resident_memory_bytes',
    title: 'Memory Usage',
    name: 'Memory Usage',
    type: ['MB'],
    path_starts_with: '',
    label: []
  }
} as const;
