
import { DatabaseType, LogLevel } from '@common/enums/common.enum';
import { AdapterConstructor, ParamHandler, ParserFn, ParserType, SortBy, SortOrder } from '@common/types/common.type';
import { PostgreSQLAdapter } from '@core/database/adapters/postgresql.adapter';
import { ValidationService } from '@common/services/validation.service';

export const DATABASE_ADAPTER_MAP: Record<DatabaseType, AdapterConstructor> = {
  [DatabaseType.POSTGRESQL]: PostgreSQLAdapter
};

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

export const paramHandlers: Record<string, ParamHandler> = {
  body: async (_, index, args, paramTypes, req) => {
    if (paramTypes[index] && req.body) {
      const dtoClass = paramTypes[index];
      args[index] = await ValidationService.validateAndTransform(dtoClass, req.body);
    } else args[index] = req.body;
  },
  param: (param, index, args, _paramTypes, req) => {
    args[index] = param.data ? req.params[param.data] : req.params;
  },
  query: async (param, index, args, paramTypes, req) => {
    if (paramTypes[index] && req.query) {
      const dtoClass = paramTypes[index];
      args[index] = await ValidationService.validateQuery(dtoClass, req.query);
    } else args[index] = param.data ? req.query[param.data] : req.query;
  },
  headers: (param, index, args, _paramTypes, req) => {
    args[index] = param.data ? req.headers[param.data] : req.headers;
  },
};

export const SORT_BY_VALUES: readonly SortBy[] = [
  'id',
  'firstName',
  'lastName',
  'email',
  'createdAt'
];

export const SORT_ORDER_VALUES: readonly SortOrder[] = ['ASC', 'DESC'];
