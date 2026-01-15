import { DatabaseType } from '@common/enums/common.enum';
import { ValidationService } from '@common/services/validation.service';
import { AdapterConstructor, ParamHandler, SortBy, SortOrder } from '@common/types/common.type';
import { PostgreSQLAdapter } from '@core/database/adapters/postgresql.adapter';

export const DATABASE_ADAPTER_MAP: Record<DatabaseType, AdapterConstructor> = {
  [DatabaseType.POSTGRESQL]: PostgreSQLAdapter
};

export const paramHandlers: Record<string, ParamHandler> = {
  body: async (param, index, args, paramTypes, req) => {
    if (!param.data && paramTypes[index] && req.body && paramTypes[index] !== Object) {
      const dtoClass = paramTypes[index];
      args[index] = await ValidationService.validateAndTransform(dtoClass, req.body);
    } else {
      const body = req.body as Record<string, unknown>;
      args[index] = typeof param.data === 'string' ? body[param.data] : body;
    }
  },
  param: (param, index, args, _paramTypes, req) => {
    args[index] = typeof param.data === 'string' ? req.params[param.data] : req.params;
  },
  query: async (param, index, args, paramTypes, req) => {
    if (!param.data && paramTypes[index] && req.query) {
      const dtoClass = paramTypes[index];
      args[index] = await ValidationService.validateQuery(dtoClass, req.query);
    } else {
      args[index] = typeof param.data === 'string' ? req.query[param.data] : req.query;
    }
  },
  headers: (param, index, args, _paramTypes, req) => {
    args[index] = typeof param.data === 'string' ? req.headers[param.data] : req.headers;
  },
  request: (_param, index, args, _paramTypes, req) => {
    args[index] = req;
  },
  response: (_param, index, args, _paramTypes, _req, res) => {
    args[index] = res;
  }
};

export const SORT_BY_VALUES: readonly SortBy[] = ['id', 'firstName', 'lastName', 'email', 'createdAt'];

export const SORT_ORDER_VALUES: readonly SortOrder[] = ['ASC', 'DESC'];
