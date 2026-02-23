import { ColumnMapping } from '../../../domain/interfaces/database/database-common.interface';
import { QueryWithPaginationOptions } from '../../../domain/interfaces/database/query-builder.interface';

export class WhereBuilder {
  constructor (private columnMappings: ColumnMapping) {}

  buildWhereConditions (
    options: QueryWithPaginationOptions,
    params: unknown[],
    startParamIndex: number
  ): { conditions: string[]; paramIndex: number } {
    const conditions: string[] = [];
    let paramIndex = startParamIndex;

    const objectConditions = this.buildObjectConditions(options, params, paramIndex);
    conditions.push(...objectConditions.conditions);
    paramIndex = objectConditions.paramIndex;

    const arrayConditions = this.buildArrayConditions(options, params, paramIndex);
    conditions.push(...arrayConditions.conditions);
    paramIndex = arrayConditions.paramIndex;

    const searchConditions = this.buildSearchConditions(options, params, paramIndex);
    conditions.push(...searchConditions.conditions);
    paramIndex = searchConditions.paramIndex;

    return { conditions, paramIndex };
  }

  private buildObjectConditions (
    options: QueryWithPaginationOptions,
    params: unknown[],
    startParamIndex: number
  ): { conditions: string[]; paramIndex: number } {
    const conditions: string[] = [];
    let paramIndex = startParamIndex;

    if (options.where && !Array.isArray(options.where) && Object.keys(options.where).length > 0) {
      Object.entries(options.where).forEach(([key, value]) => {
        const dbColumn = this.columnMappings[key] || key;
        conditions.push(`${dbColumn} = $${paramIndex++}`);
        params.push(value);
      });
    }

    return { conditions, paramIndex };
  }

  private buildArrayConditions (
    options: QueryWithPaginationOptions,
    params: unknown[],
    startParamIndex: number
  ): { conditions: string[]; paramIndex: number } {
    const conditions: string[] = [];
    let paramIndex = startParamIndex;

    if (options.where && Array.isArray(options.where)) {
      options.where.forEach(condition => {
        const dbColumn = this.columnMappings[condition.field] || condition.field;
        conditions.push(`${dbColumn} ${condition.operator} $${paramIndex++}`);
        params.push(condition.value);
      });
    }

    return { conditions, paramIndex };
  }

  private buildSearchConditions (
    options: QueryWithPaginationOptions,
    params: unknown[],
    startParamIndex: number
  ): { conditions: string[]; paramIndex: number } {
    const conditions: string[] = [];
    let paramIndex = startParamIndex;

    if (options.search && options.search.fields.length > 0 && options.search.term) {
      const searchConditions = options.search.fields.map(field => {
        const dbColumn = this.columnMappings[field] || field;
        return `LOWER(${dbColumn}) LIKE LOWER($${paramIndex})`;
      });

      conditions.push(`(${searchConditions.join(' OR ')})`);
      params.push(`%${options.search.term}%`);
      paramIndex++;
    }

    return { conditions, paramIndex };
  }
}
