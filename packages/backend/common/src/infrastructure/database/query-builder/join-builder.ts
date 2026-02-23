import { ColumnMapping } from '../../../domain/interfaces/database/database-common.interface';
import { JoinClause } from '../../../domain/interfaces/database/database.interface';

export class JoinBuilder {
  constructor (private columnMappings: ColumnMapping) {}

  buildJoinClauses (joins: JoinClause[]): string {
    if (!joins || joins.length === 0) return '';
    return joins.map(join => this.buildSingleJoin(join)).join(' ');
  }

  private buildSingleJoin = (join: JoinClause): string => `${join.type} JOIN ${join.table} ON ${this.mapJoinCondition(join.on)}`;

  private mapJoinCondition (condition: string): string {
    void this.columnMappings;
    return condition;
  }
}
