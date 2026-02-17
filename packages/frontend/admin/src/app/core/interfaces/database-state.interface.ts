import { Schema, TableMetadata } from './database.interface';

export interface DatabaseState {
  schema: Schema | null;
  selectedTable: TableMetadata | null;
  tableData: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  searchQuery: string;
  loadingSchema: boolean;
  loadingData: boolean;
  isPublishing: boolean;
}
