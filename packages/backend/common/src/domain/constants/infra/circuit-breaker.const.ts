export const CIRCUIT_BREAKER_KEYS = {
  POSTGRES: 'db_postgresql',
  KAFKA: 'infra_kafka',
  REDIS: 'infra_redis',
  STORAGE: 'infra_storage'
} as const;

export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 10000;
