import { LogLevel } from '../../enums/infra/infra.enum';
import { KeyGenerator } from '../../types/infra/bullmq.type';
import { WithAttempts } from './bullmq.interface';

export interface WithKey {
  key?: KeyGenerator;
}

export interface WithTtl {
  ttl?: number;
}

export interface WithTimeout {
  timeout?: number;
}

export interface WithPriority {
  priority?: number;
}

export interface WithRemoveOnComplete {
  removeOnComplete?: boolean | number;
}

export interface WithRemoveOnFail {
  removeOnFail?: boolean | number;
}

export interface WithDelay {
  delay?: number;
}

export interface WithBackground {
  background?: boolean;
}

export interface CacheOptions extends WithTtl, WithKey {
  prefix?: string;
}

export interface InvalidateCacheOptions {
  keys: KeyGenerator[];
}

export interface ComputeOptions extends WithAttempts, WithRemoveOnComplete, WithRemoveOnFail, WithPriority, WithDelay, WithBackground {
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

export interface CheckRateLimitParams {
  key: string;
  limit: number;
  ttl: number;
}
