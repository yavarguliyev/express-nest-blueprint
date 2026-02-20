import { Injectable, inject } from '@angular/core';

import { FieldAccessService } from '../../validation/field-access.service';
import { TableMetadata } from '../../../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class FormDataPreparer {
  private fieldAccess = inject(FieldAccessService);

  prepareFormData (table: TableMetadata, record: Record<string, unknown>): Record<string, unknown> {
    const formData: Record<string, unknown> = {};

    table.columns.forEach(col => {
      if (col.editable && !this.fieldAccess.isFieldExcludedFromUpdate(col.name)) {
        formData[col.name] = record[col.name];
      }
    });

    return formData;
  }

  prepareCreateFormData (table: TableMetadata): Record<string, unknown> {
    const formData: Record<string, unknown> = {};

    table.columns.forEach(col => {
      if (col.editable && !this.fieldAccess.isFieldExcludedFromUpdate(col.name, null)) {
        formData[col.name] = col.type === 'boolean' ? false : '';
      }
    });

    const hasEmail = table.columns.some(c => c.name === 'email');
    const hasPassword = table.columns.some(c => c.name === 'password');

    if (hasEmail && !hasPassword) formData['password'] = '';

    return formData;
  }
}
