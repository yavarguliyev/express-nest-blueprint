import { LogLevel } from '@common/enums/common.enum';
import { ParserFn, ParserType } from '@common/types/common.type';

export const METHODS = ['get', 'post', 'put', 'delete', 'patch', 'use'] as const;

export const levelMap: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'error',
  [LogLevel.WARN]: 'warn',
  [LogLevel.LOG]: 'info',
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.VERBOSE]: 'verbose'
};

export const parsers: Record<ParserType, ParserFn> = {
  boolean: (v) => v.toLowerCase() === 'true',
  number: (v, def) => {
    const n = Number(v);
    return isNaN(n) ? def : n;
  },
  string: (v) => v
};

export const INITIALIZER_TOKENS = ['APP_INITIALIZER', 'CACHE_INITIALIZER', 'COMPUTE_INITIALIZER', 'COMPUTE_MODULE_OPTIONS', 'DATABASE_INITIALIZER', 'LIFECYCLE_INITIALIZER', 'LOGGER_INITIALIZER', 'REDIS_INITIALIZER'] as const;
