export const METRIC_CONFIG = {
  PREFIX: '',
  LABELS: {
    METHOD: 'method', PATH: 'path', STATUS: 'status', OPERATION: 'operation', RESULT: 'result',
    TOPIC: 'topic', GROUP: 'consumer_group', QUERY: 'query_type', TABLE: 'table',
    UNKNOWN: 'unknown', TIME_SUFFIX: 's'
  },
  NAMES: {
    HTTP_TOTAL: 'http_requests_total', HTTP_DURATION: 'http_request_duration_seconds',
    HTTP_ACTIVE: 'http_active_requests_total', CACHE_TOTAL: 'cache_operations_total',
    CACHE_RATIO: 'cache_hit_ratio', DB_DURATION: 'database_query_duration_seconds',
    DB_ACTIVE: 'database_connections_active', KAFKA_TOTAL: 'kafka_messages_processed_total',
    KAFKA_DURATION: 'kafka_message_processing_duration_seconds', S3_TOTAL: 's3_operations_total',
    S3_DURATION: 's3_operation_duration_seconds', FALLBACK_CPU: 'process_cpu_user_seconds_total',
    FALLBACK_MEM: 'process_resident_memory_bytes'
  },
  BUCKETS: {
    HTTP: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    DB: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    KAFKA: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    S3: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30]
  }
} as const;

export const HEALTH_REGISTRY = {
  DATABASE: { key: 'database', name: 'Database Usage', unit: 'MB', critical: true, threshold: 5000 },
  REDIS: { key: 'redis', name: 'Redis Usage', unit: 'MB', critical: true, threshold: 1024 },
  STORAGE: { key: 'storage', name: 'S3 Bucket Usage', unit: 'MB', critical: true, threshold: 50000 },
  KAFKA_TPS: { key: 'kafka', name: 'Kafka Usage', unit: 'msg/s', critical: true, threshold: 0.8, precision: 2 },
  KAFKA_LAG: { key: 'kafka', name: 'Kafka Under Replication Usage', unit: 'partitions', critical: true, threshold: 0.8 },
  USERS: { key: 'users', name: 'Total Users', unit: 'users', threshold: null },
  CPU: { key: 'CPU', name: 'CPU Usage', unit: '%', critical: true, threshold: 5, promMetric: METRIC_CONFIG.NAMES.FALLBACK_CPU, precision: 1 },
  MEMORY: { key: 'Memory', name: 'Memory Usage', unit: 'MB', critical: true, threshold: 500, promMetric: METRIC_CONFIG.NAMES.FALLBACK_MEM },
  HTTP_REQS: { key: 'http', name: 'Total HTTP Requests', unit: 'reqs', promMetric: METRIC_CONFIG.NAMES.HTTP_TOTAL },
  QUEUES: { key: 'queues', name: 'Queues Usage', unit: 'items', threshold: 1000 },
  COMPUTE: { key: 'compute workers', name: 'Compute Workers Usage', unit: 'workers', critical: true, threshold: 80 }
} as const;

export const ALERT_TEMPLATES = {
  THRESHOLD_EXCEEDED: {
    header: 'Recent Alerts',
    title: (metricName: string): string => `${metricName} High`,
    message: (metricName: string, value: number, unit: string, precision = 1): string => `${metricName} has exceeded its safe threshold (${Number (value).toFixed (precision)} ${unit}).`,
    type: 'warning' as const
  },
  SYSTEM_STABLE: {
    header: 'Recent Alerts',
    title: (): string => 'System Stable',
    message: (): string => 'All core services are performing within normal parameters.',
    type: 'info' as const
  }
} as const;

export const DASHBOARD_CHARTS = {
  HTTP_DURATION: { title: 'Request Duration Distribution', metric: METRIC_CONFIG.NAMES.HTTP_DURATION, type: 'bar' },
  HTTP_STATUS: { title: 'Requests by Status Code', metric: METRIC_CONFIG.NAMES.HTTP_TOTAL, type: 'pie' }
} as const;
