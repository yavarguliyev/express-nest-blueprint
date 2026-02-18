import { Injectable, inject, signal } from '@angular/core';

import { TableMetadata } from '../../interfaces/database.interface';
import { DatabaseFormService } from './database-form.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseModalService {
  private dbForm = inject(DatabaseFormService);

  showUpdateModal = signal(false);
  modalMode = signal<'create' | 'update'>('update');
  selectedRecord = signal<Record<string, unknown> | null>(null);
  updateFormData = signal<Record<string, unknown>>({});
  originalFormData = signal<Record<string, unknown>>({});
  showPassword = signal(false);

  openCreateModal (table: TableMetadata): void {
    const formData = this.dbForm.prepareCreateFormData(table);
    this.modalMode.set('create');
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
  }

  openUpdateModal (table: TableMetadata, record: Record<string, unknown>): void {
    const formData = this.dbForm.prepareFormData(table, record);
    this.modalMode.set('update');
    this.selectedRecord.set(record);
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
  }

  closeModal (): void {
    this.showUpdateModal.set(false);
    this.selectedRecord.set(null);
    this.updateFormData.set({});
    this.originalFormData.set({});
  }

  updateFormField (field: string, value: unknown): void {
    this.updateFormData.update(current => ({ ...current, [field]: value }));
  }

  isFieldChanged (field: string): boolean {
    const current = this.updateFormData()[field];
    const original = this.originalFormData()[field];
    return current !== original;
  }

  submitForm (table: TableMetadata): boolean {
    let success = false;

    if (this.modalMode() === 'create') success = this.dbForm.validateAndSubmitCreate(table, this.updateFormData());
    else {
      const record = this.selectedRecord();
      if (!record) return false;
      success = this.dbForm.validateAndSubmitUpdate(table, record, this.updateFormData(), this.originalFormData());
    }

    if (success) this.closeModal();
    return success;
  }
}
