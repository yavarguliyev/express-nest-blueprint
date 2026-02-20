import { Injectable, RepositoryEntry } from '@config/libs';

import { TableMetadata } from '@modules/admin/interfaces/admin.interface';

@Injectable()
export class SchemaBuilder {
  buildTableSchema (
    repositories: Map<string, RepositoryEntry>,
    getTableColumns: (repositories: Map<string, RepositoryEntry>, tableName: string) => unknown[]
  ): Record<string, TableMetadata[]> {
    const schema: Record<string, TableMetadata[]> = {};

    for (const [, { metadata }] of repositories) {
      if (!schema[metadata.category]) schema[metadata.category] = [];

      schema[metadata.category]?.push({
        category: metadata.category,
        name: metadata.name,
        displayName: metadata.displayName || metadata.name,
        tableName: metadata.name,
        columns: getTableColumns(repositories, metadata.name) as never[],
        actions: metadata.actions || { create: true, update: true, delete: true }
      });
    }

    return schema;
  }
}
