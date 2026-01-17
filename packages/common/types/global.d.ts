declare namespace NodeJS {
  interface ProcessEnv {
    // app configs
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    SHUT_DOWN_TIMER: string;
    SHUTDOWN_RETRIES: string;
    SHUTDOWN_RETRY_DELAY: string;

    // compute configs
    APP_ROLE: string;
    COMPUTE_APP_ROLE: string;
    COMPUTE_AUTO_SPAWN: string;
    COMPUTE_MIN_WORKERS: string;
    COMPUTE_MAX_WORKERS: string;

    // queue configs
    QUEUE_REMOVE_ON_COMPLETE: string;
    QUEUE_REMOVE_ON_FAIL: string;
    QUEUE_ATTEMPTS: string;
    QUEUE_BACKOFF_TYPE: string;
    QUEUE_BACKOFF_DELAY: string;

    // JWT configs
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;

    // rate limiting configs
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_REQUESTS: string;
    RATE_LIMIT_MESSAGE: string;
    RATE_LIMIT_ERROR_TITLE: string;
    RATE_LIMIT_ERROR_MESSAGE: string;

    // redis configs
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD: string;
    REDIS_URL: string;
    REDIS_DEFAULT_CACHE_TTL: string;
    REDIS_DB: string;
    REDIS_CONCURRENCY: string;
    QUEUE_REMOVE_ON_COMPLETE: string;
    QUEUE_REMOVE_ON_FAIL: string;
    QUEUE_ATTEMPTS: string;
    QUEUE_BACKOFF_TYPE: string;
    QUEUE_BACKOFF_DELAY: string;

    // postgres configs
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_CONNECTION_LIMIT: string;

    // storage configs
    STORAGE_STRATEGY: string;
    STORAGE_ENDPOINT: string;
    STORAGE_ACCESS_KEY: string;
    STORAGE_SECRET_KEY: string;
    STORAGE_BUCKET_NAME: string;
    STORAGE_REGION: string;
    STORAGE_FORCE_PATH_STYLE: string;
  }
}
