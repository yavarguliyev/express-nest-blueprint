export const METRIC_NAMES = {
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION_SECONDS: 'http_request_duration_seconds',
  HTTP_ACTIVE_REQUESTS: 'http_active_requests_total',
  CACHE_OPERATIONS_TOTAL: 'cache_operations_total',
  CACHE_HIT_RATIO: 'cache_hit_ratio',
  DATABASE_QUERY_DURATION_SECONDS: 'database_query_duration_seconds',
  DATABASE_CONNECTIONS_ACTIVE: 'database_connections_active',
  KAFKA_MESSAGES_PROCESSED_TOTAL: 'kafka_messages_processed_total',
  KAFKA_MESSAGE_PROCESSING_DURATION_SECONDS: 'kafka_message_processing_duration_seconds',
  S3_OPERATIONS_TOTAL: 's3_operations_total',
  S3_OPERATION_DURATION_SECONDS: 's3_operation_duration_seconds'
} as const;

export const METRIC_LABELS = {
  METHOD: 'method',
  PATH: 'path',
  STATUS: 'status',
  OPERATION: 'operation',
  RESULT: 'result',
  TOPIC: 'topic',
  CONSUMER_GROUP: 'consumer_group',
  QUERY_TYPE: 'query_type',
  TABLE: 'table'
} as const;

export const HISTOGRAM_BUCKETS = {
  HTTP_DURATION: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  DATABASE_DURATION: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  KAFKA_DURATION: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  S3_DURATION: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30]
};

