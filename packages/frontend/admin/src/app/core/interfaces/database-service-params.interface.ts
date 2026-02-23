import { Column, TableMetadata } from './database.interface';

export interface PrepareFormDataParams {
  table: TableMetadata;
  record: Record<string, unknown>;
}

export interface ValidateAndSubmitUpdateParams extends PrepareFormDataParams {
  currentData: Record<string, unknown>;
  originalData: Record<string, unknown>;
}

export interface SubmitButtonTextParams {
  mode: 'create' | 'update';
  hasChanges: boolean;
}

export interface HandleBooleanUpdateParams extends PrepareFormDataParams {
  column: Column;
  newValue: boolean;
}

export interface DeleteRecordParams {
  table: TableMetadata;
  id: number;
  tableData: Record<string, unknown>[];
}

export interface RecordDraftParams {
  table: TableMetadata;
  recordId: number;
}

export interface GetBooleanValueParams {
  record: Record<string, unknown>;
  column: string;
  table: TableMetadata;
  getNumberValue: (record: Record<string, unknown>, column: string) => number;
}
