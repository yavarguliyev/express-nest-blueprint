import { ColumnMapping, QueryWithPaginationOptions } from '../database/interfaces/query-builder.interface';

export class QueryBuilder<T> {
  private tableName: string;
  private columnMappings: ColumnMapping;

  constructor (tableName: string, columnMappings: ColumnMapping = {}) {
    this.tableName = tableName;
    this.columnMappings = columnMappings;
  }

  buildSelectQuery (columns: string[], options: QueryWithPaginationOptions = {}): { query: string; params: unknown[] } {
    const mappedColumns = this.mapColumns(columns);
    let query = `SELECT ${mappedColumns} FROM ${this.tableName}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    const whereConditions = this.buildWhereConditions(options, params, paramIndex);
    if (whereConditions.conditions.length > 0) {
      query += ` WHERE ${whereConditions.conditions.join(' AND ')}`;
      paramIndex = whereConditions.paramIndex;
    }

    if (options.orderBy) {
      const dbColumn = this.columnMappings[options.orderBy] || options.orderBy;
      const direction = options.orderDirection || 'ASC';
      query += ` ORDER BY ${dbColumn} ${direction}`;
    }

    if (options.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    return { query, params };
  }

  buildInsertQuery<K extends keyof T> (data: Record<string, unknown>, returningColumns?: K[]): { query: string; params: unknown[] } {
    const columnsKeys = Object.keys(data);
    const dbColumns = columnsKeys.map((col) => this.columnMappings[col] || col);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const colsToReturn = returningColumns ?? (columnsKeys as K[]);
    const returning = colsToReturn.map((col) => `${String(this.columnMappings[col as string] || col)} AS "${String(col)}"`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${dbColumns.join(', ')})
      VALUES (${placeholders})
      RETURNING ${returning}
    `;

    return { query, params: values };
  }

  buildUpdateQuery<K extends string> (id: number, data: Record<string, unknown>, returningColumns: K[]): { query: string; params: unknown[] } {
    const columns = Object.keys(data);
    const params: unknown[] = [];
    let paramIndex = 1;

    const setClause = columns
      .map((col) => {
        const dbColumn = this.columnMappings[col] || col;
        params.push(data[col]);
        return `${dbColumn} = $${paramIndex++}`;
      })
      .join(', ');

    params.push(id);

    const returning = returningColumns.length
      ? 'RETURNING ' +
        returningColumns
          .map((col) => this.columnMappings[col] || col)
          .map((c, i) => `${c} AS "${returningColumns[i]}"`)
          .join(', ')
      : '';

    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      ${returning}
    `;

    return { query, params };
  }

  buildDeleteQuery (id: number): { query: string; params: unknown[] } {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    return { query, params: [id] };
  }

  buildCountQuery (options: QueryWithPaginationOptions = {}): { query: string; params: unknown[] } {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: unknown[] = [];
    const paramIndex = 1;

    const whereConditions = this.buildWhereConditions(options, params, paramIndex);
    if (whereConditions.conditions.length > 0) query += ` WHERE ${whereConditions.conditions.join(' AND ')}`;

    return { query, params };
  }

  private mapColumns (columns: string[]): string {
    return columns
      .map((col) => {
        const mapping = this.columnMappings[col];
        return mapping ? `${mapping} as "${col}"` : col;
      })
      .join(', ');
  }

  private buildWhereConditions (options: QueryWithPaginationOptions, params: unknown[], startParamIndex: number): { conditions: string[]; paramIndex: number } {
    const conditions: string[] = [];
    let paramIndex = startParamIndex;

    if (options.where && !Array.isArray(options.where) && Object.keys(options.where).length > 0) {
      Object.entries(options.where).forEach(([key, value]) => {
        const dbColumn = this.columnMappings[key] || key;
        conditions.push(`${dbColumn} = $${paramIndex++}`);
        params.push(value);
      });
    }

    if (options.where && Array.isArray(options.where)) {
      options.where.forEach((condition) => {
        const dbColumn = this.columnMappings[condition.field] || condition.field;
        conditions.push(`${dbColumn} ${condition.operator} $${paramIndex++}`);
        params.push(condition.value);
      });
    }

    if (options.search && options.search.fields.length > 0 && options.search.term) {
      const searchConditions = options.search.fields.map((field) => {
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
