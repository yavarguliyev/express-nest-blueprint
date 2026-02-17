export const DEFAULT_API_TIMEOUT = 30000;

export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  X_REQUEST_ID: 'X-Request-ID'
} as const;
