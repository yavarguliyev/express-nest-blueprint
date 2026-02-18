import { DatabaseDraft, DatabaseOperation } from '../../interfaces/database.interface';

export class DraftOperationsUtility {
  static generateDraftId (category: string, table: string, recordId?: number | string): string {
    return `${category}:${table}:${recordId || 'new'}`;
  }

  static hasDataChanges (original: Record<string, unknown>, modified: Record<string, unknown>): boolean {
    const originalKeys = Object.keys(original);
    const modifiedKeys = Object.keys(modified);

    if (originalKeys.length !== modifiedKeys.length) return true;

    for (const key of originalKeys) {
      if (original[key] !== modified[key]) return true;
    }

    return false;
  }

  static convertDraftsToOperations (drafts: DatabaseDraft[]): DatabaseOperation[] {
    return drafts.map(draft => {
      const operation: DatabaseOperation = {
        type: draft.operation,
        table: draft.tableName,
        category: draft.category,
        recordId: draft.recordId
      };

      if (draft.operation !== 'delete') operation.data = draft.draftData;
      return operation;
    });
  }

  static createDraftObject (operation: DatabaseOperation, originalData: Record<string, unknown> | null, draftId: string): DatabaseDraft {
    return {
      id: draftId,
      tableName: operation.table,
      category: operation.category,
      recordId: operation.recordId || 'new',
      operation: operation.type,
      originalData: originalData ? { ...originalData } : {},
      draftData: operation.data ? { ...operation.data } : originalData ? { ...originalData } : {},
      hasChanges: operation.type === 'delete' || !!operation.data,
      timestamp: new Date()
    };
  }
}
