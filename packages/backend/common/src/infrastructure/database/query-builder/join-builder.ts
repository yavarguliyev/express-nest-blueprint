import { JoinClause } from '../../../domain/interfaces/database/database.interface';
import { ColumnMapping } from '../../../domain/interfaces/database/query-builder.interface';

export class JoinBuilder {
  constructor (private columnMappings: ColumnMapping) {}

  buildJoinClauses (joins: JoinClause[]): string {
    if (!joins || joins.length === 0) return '';
    return joins.map(join => this.buildSingleJoin(join)).join(' ');
  }

  private buildSingleJoin (join: JoinClause): string {
    const mappedOn = this.mapJoinCondition(join.on);
    return `${join.type} JOIN ${join.table} ON ${mappedOn}`;
  }

  private mapJoinCondition (condition: string): string {
    void this.columnMappings;
    return condition;
  }
}
