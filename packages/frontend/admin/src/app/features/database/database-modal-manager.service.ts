import { Injectable, inject, signal } from '@angular/core';

import { TableMetadata } from '../../core/interfaces/database.interface';
import { DatabaseFormService } from '../../core/services/database/database-form.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseModalManagerService {
  private dbForm = inject(DatabaseFormService);

  readonly showUpdateModal = signal(false);
  readonly modalMode = signal<'create' | 'update'>('update');
  readonly selectedRecord = signal<Record<string, unknown> | null>(null);
  readonly updateFormData = signal<Record<string, unknown>>({});
  readonly originalFormData = signal<Record<string, unknown>>({});

  openCreateModal (table: TableMetadata): void {
    const formData = this.dbForm.prepareCreateFormData(table);
    this.modalMode.set('create');
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
    document.body.classList.add('modal-open');
  }

  openUpdateModal (table: TableMetadata, record: Record<string, unknown>): void {
    const formData = this.dbForm.prepareFormData({ table, record });
    this.modalMode.set('update');
    this.selectedRecord.set(record);
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
    document.body.classList.add('modal-open');
  }

  closeModal (): void {
    this.showUpdateModal.set(false);
    this.selectedRecord.set(null);
    this.updateFormData.set({});
    this.originalFormData.set({});
    document.body.classList.remove('modal-open');
  }

  updateFormField (field: string, value: unknown): void {
    this.updateFormData.update(current => ({ ...current, [field]: value }));
  }

  isFieldChanged (field: string): boolean {
    return this.updateFormData()[field] !== this.originalFormData()[field];
  }

  submitForm (table: TableMetadata): boolean {
    if (this.modalMode() === 'create') {
      return this.dbForm.validateAndSubmitCreate(table, this.updateFormData());
    } else {
      const record = this.selectedRecord();
      if (!record) return false;
      return this.dbForm.validateAndSubmitUpdate({
        table,
        record,
        currentData: this.updateFormData(),
        originalData: this.originalFormData()
      });
    }
  }
}
