export enum AppName {
  DEFAULT = 'Default Service',
  MAIN = 'Main Service'
}

export enum AppRoles {
  API = 'api',
  WORKER = 'worker'
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export enum DatabaseType {
  POSTGRESQL = 'postgresql'
}

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  LOG = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  ALL = 'ALL'
}
