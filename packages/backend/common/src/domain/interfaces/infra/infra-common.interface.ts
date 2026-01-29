import { LogLevel } from '../../enums/infra/infra.enum';

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export interface ComputeOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  background?: boolean;
  timeout?: number;
}

export interface CircuitBreakerOptions {
  key?: string;
  threshold?: number;
  timeout?: number;
}

export interface RetryOptions {
  maxRetries: number;
  onFailure?: (error: Error, attempt: number) => void;
  onRetry?: (attempt: number) => void;
  retryDelay: number;
  serviceName: string;
}

export interface LoggerModuleOptions {
  config?: LoggerOptions;
}

export interface LoggerOptions {
  context?: string;
  timestamp?: boolean;
  logLevel?: LogLevel;
}

export interface GracefulShutDownServiceConfig {
  name: string;
  disconnect: () => Promise<void>;
}

export interface RateLimitStatus {
  total: number;
  remaining: number;
  reset: number;
  isBlocked: boolean;
}
