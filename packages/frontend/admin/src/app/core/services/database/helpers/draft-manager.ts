import { signal, computed } from '@angular/core';

import { DatabaseDraft, DatabaseOperation } from '../../../interfaces/database.interface';
import { DraftStorageUtility } from '../../utilities/draft-storage.service';
import { DraftOperationsUtility } from '../../utilities/draft-operations.service';

export class DraftManager {
  private _drafts = signal<Map<string, DatabaseDraft>>(new Map());

  drafts = this._drafts.asReadonly();

  draftCount = computed(() => {
    return Array.from(this._drafts().values()).filter(draft => draft.hasChanges).length;
  });

  hasDrafts = computed(() => this.draftCount() > 0);

  affectedTables = computed(() => {
    const drafts = this._drafts();
    const tables = new Set<string>();
    Array.from(drafts.values())
      .filter(draft => draft.hasChanges)
      .forEach(draft => tables.add(draft.tableName));

    return Array.from(tables);
  });

  affectedCategories = computed(() => {
    const drafts = this._drafts();
    const categories = new Set<string>();
    Array.from(drafts.values())
      .filter(draft => draft.hasChanges)
      .forEach(draft => categories.add(draft.category));

    return Array.from(categories);
  });

  constructor () {
    this._drafts.set(DraftStorageUtility.loadDrafts());
  }

  createDraft (operation: DatabaseOperation, originalData: Record<string, unknown> | null): void {
    const draftId = DraftOperationsUtility.generateDraftId(operation.category, operation.table, operation.recordId);
    const draft = DraftOperationsUtility.createDraftObject(operation, originalData, draftId);
    const newDrafts = new Map(this._drafts());
    newDrafts.set(draftId, draft);
    this._drafts.set(newDrafts);
    this.saveDrafts();
  }

  updateDraft (draftId: string, data: Record<string, unknown>): void {
    const currentDrafts = this._drafts();
    const existingDraft = currentDrafts.get(draftId);
    if (!existingDraft) return;

    const hasChanges = DraftOperationsUtility.hasDataChanges(existingDraft.originalData, data);
    const updatedDraft: DatabaseDraft = {
      ...existingDraft,
      draftData: { ...data },
      hasChanges,
      timestamp: new Date()
    };

    const newDrafts = new Map(currentDrafts);
    if (hasChanges) newDrafts.set(draftId, updatedDraft);
    else newDrafts.delete(draftId);

    this._drafts.set(newDrafts);
    this.saveDrafts();
  }

  deleteDraft (draftId: string): void {
    const newDrafts = new Map(this._drafts());
    newDrafts.delete(draftId);
    this._drafts.set(newDrafts);
    this.saveDrafts();
  }

  getDraft (draftId: string): DatabaseDraft | null {
    return this._drafts().get(draftId) || null;
  }

  hasDraftChanges (draftId: string): boolean {
    const draft = this._drafts().get(draftId);
    return draft ? draft.hasChanges : false;
  }

  getDraftForRecord (category: string, table: string, recordId: number | string): DatabaseDraft | null {
    const draftId = DraftOperationsUtility.generateDraftId(category, table, recordId);
    return this.getDraft(draftId);
  }

  resetDrafts (): void {
    this._drafts.set(new Map());
    this.saveDrafts();
  }

  removeDrafts (draftIds: string[]): void {
    const newDrafts = new Map(this._drafts());
    let changed = false;
    draftIds.forEach(id => {
      if (newDrafts.delete(id)) changed = true;
    });

    if (changed) {
      this._drafts.set(newDrafts);
      this.saveDrafts();
    }
  }

  getAllDraftsWithChanges (): DatabaseDraft[] {
    return Array.from(this._drafts().values()).filter(draft => draft.hasChanges);
  }

  private saveDrafts (): void {
    DraftStorageUtility.saveDrafts(this._drafts(), this.draftCount(), this.affectedTables());
  }
}
