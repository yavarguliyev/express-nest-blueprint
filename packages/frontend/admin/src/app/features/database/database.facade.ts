import { Injectable, inject, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { DatabaseDraftService } from '../../core/services/database-draft.service';
import { DatabaseOperationsService } from '../../core/services/database-operations.service';
import { DatabaseHelperService } from '../../core/services/database-helper.service';
import { DatabaseFormService } from '../../core/services/database-form.service';
import { ApiConfigService } from '../../core/services/api-config.service';
import { PaginationService } from '../../core/services/pagination.service';
import { ApiResponse, PaginatedResponse } from '../../core/interfaces/api-response.interface';
import {
  TableMetadata,
  Schema,
  Column,
  DatabaseOperation,
} from '../../core/services/database-operations.service';

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

@Injectable({
  providedIn: 'root',
})
export class DatabaseFacade {
  private toastService = inject(ToastService);
  private dbOperations = inject(DatabaseOperationsService);
  private apiConfig = inject(ApiConfigService);
  private dbHelper = inject(DatabaseHelperService);
  private dbForm = inject(DatabaseFormService);
  private pagination = inject(PaginationService);
  private draftService = inject(DatabaseDraftService);

  readonly draftCount: Signal<number> = this.draftService.draftCount;
  readonly hasDrafts: Signal<boolean> = this.draftService.hasDrafts;
  readonly affectedTables: Signal<string[]> = this.draftService.affectedTables;

  loadSchema (): Observable<ApiResponse<Schema>> {
    return this.dbOperations.loadSchema();
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    return this.dbOperations.loadTableData(table, page, limit, searchQuery);
  }

  toggleProtocol (currentProtocol: 'rest' | 'graphql'): void {
    const newProtocol = currentProtocol === 'rest' ? 'graphql' : 'rest';
    this.apiConfig.setProtocol(newProtocol);
    this.toastService.info(`Switched to ${newProtocol.toUpperCase()} mode`);
  }

  isGraphQL (): boolean {
    return this.apiConfig.isGraphQL();
  }

  calculateTotalPages (total: number, limit: number): number {
    return this.pagination.calculateTotalPages(total, limit);
  }

  generatePageNumbers (currentPage: number, totalPages: number): number[] {
    return this.pagination.generatePageNumbers(currentPage, totalPages);
  }

  isValidPageChange (newPage: number, totalPages: number): boolean {
    return this.pagination.isValidPageChange(newPage, totalPages);
  }

  setupScrollIndicators (element: HTMLDivElement): void {
    this.dbHelper.setupScrollIndicators(element);
  }

  canDeleteRecord (): boolean {
    return this.dbHelper.canDeleteRecord();
  }

  formatValue (value: unknown, column: Column): string {
    return this.dbHelper.formatValue(value, column);
  }

  getBooleanValue (
    record: Record<string, unknown>,
    columnName: string,
    draftData?: Record<string, unknown> | null,
  ): boolean {
    return this.dbHelper.getBooleanValue(record, columnName, draftData ?? null);
  }

  getNumberValue (record: Record<string, unknown>, columnName: string): number {
    return this.dbHelper.getNumberValue(record, columnName);
  }

  getFieldDisplayName (fieldName: string): string {
    return this.dbHelper.getFieldDisplayName(fieldName);
  }

  getUserInitials (record: Record<string, unknown>): string {
    return this.dbHelper.getUserInitials(record);
  }

  isImageUrl (name: string): boolean {
    return this.dbHelper.isImageUrl(name);
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return this.dbHelper.getAvailableRoles();
  }

  getHeaderClasses (name: string, type: string): string {
    return this.dbHelper.getHeaderClasses(name, type);
  }

  getCellClasses (name: string, type: string): string {
    return this.dbHelper.getCellClasses(name, type);
  }

  getColumnStyles (name: string, type: string): Record<string, string> {
    return this.dbHelper.getColumnStyles(name, type);
  }

  hasAnyActions (table: TableMetadata | null): boolean {
    return this.dbHelper.hasAnyActions(table);
  }

  canModifySensitiveFields (): boolean {
    return this.dbHelper.canModifySensitiveFields();
  }

  isSensitiveField (name: string): boolean {
    return this.dbHelper.isSensitiveField(name);
  }

  formatFieldValue (value: unknown): string {
    return this.dbHelper.formatFieldValue(value);
  }

  handleImageClick (imageUrl: string): void {
    this.dbHelper.handleImageClick(imageUrl);
  }

  publishAllChanges (
    hasDrafts: boolean,
    setPublishing: (value: boolean) => void,
    onSuccess: () => void,
  ): void {
    this.dbHelper.publishAllChanges(hasDrafts, setPublishing, onSuccess);
  }

  resetAllChanges (hasDrafts: boolean, draftCount: number, onSuccess: () => void): void {
    this.dbHelper.resetAllChanges(hasDrafts, draftCount, onSuccess);
  }

  isCurrentUser (id: number): boolean {
    return this.dbForm.isCurrentUser(id);
  }

  isRestrictedTable (table: TableMetadata | null): boolean {
    return this.dbForm.isRestrictedTable(table);
  }

  isFieldExcludedFromUpdate (columnName: string, record: Record<string, unknown> | null): boolean {
    return this.dbForm.isFieldExcludedFromUpdate(columnName, record);
  }

  isFieldDisabled (columnName: string, table: TableMetadata | null, mode: 'create' | 'update'): boolean {
    return this.dbForm.isFieldDisabled(columnName, table, mode);
  }

  generateRandomPassword (): string {
    return this.dbForm.generateRandomPassword();
  }

  hasFormChanges (formData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    return this.dbForm.hasFormChanges(formData, originalData);
  }

  isFieldChanged (
    fieldName: string,
    formData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): boolean {
    return this.dbForm.isFieldChanged(fieldName, formData, originalData);
  }

  getChangedFields (
    formData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    return this.dbForm.getChangedFields(formData, originalData);
  }

  isRoleInvalid (formData: Record<string, unknown>): boolean {
    return this.dbForm.isRoleInvalid(formData);
  }

  isFormInvalid (formData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    return this.dbForm.isFormInvalid(formData, originalData);
  }

  getModalTitle (mode: 'create' | 'update'): string {
    return this.dbForm.getModalTitle(mode);
  }

  getSubmitButtonText (mode: 'create' | 'update', hasChanges: boolean): string {
    return this.dbForm.getSubmitButtonText(mode, hasChanges);
  }

  getSubmitButtonIcon (mode: 'create' | 'update'): string {
    return this.dbForm.getSubmitButtonIcon(mode);
  }

  getUpdateButtonTooltip (formData: Record<string, unknown>, originalData: Record<string, unknown>): string {
    return this.dbForm.getUpdateButtonTooltip(formData, originalData);
  }

  prepareCreateFormData (table: TableMetadata): Record<string, unknown> {
    return this.dbForm.prepareCreateFormData(table);
  }

  prepareFormData (
    table: TableMetadata,
    record: Record<string, unknown>,
    isFieldExcluded: (columnName: string) => boolean,
  ): Record<string, unknown> {
    return this.dbForm.prepareFormData(table, record, isFieldExcluded);
  }

  validateAndSubmitCreate (table: TableMetadata, formData: Record<string, unknown>): boolean {
    return this.dbForm.validateAndSubmitCreate(table, formData);
  }

  validateAndSubmitUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    formData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): boolean {
    return this.dbForm.validateAndSubmitUpdate(table, record, formData, originalData);
  }

  handleBooleanUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    column: Column,
    newValue: boolean,
    isSensitiveField: (columnName: string) => boolean,
    canModifySensitiveFields: () => boolean,
  ): void {
    this.dbForm.handleBooleanUpdate(table, record, column, newValue, isSensitiveField, canModifySensitiveFields);
  }

  confirmDelete (id: number, onConfirm: () => void): void {
    this.dbOperations.confirmDelete(id, onConfirm);
  }

  createDeleteDraft (table: TableMetadata, id: number, record: Record<string, unknown>): void {
    this.dbOperations.createDeleteDraft(table, id, record);
  }

  bulkUpdate (operations: DatabaseOperation[], wait: boolean): Observable<ApiResponse<unknown>> {
    return this.dbOperations.bulkUpdate(operations, wait);
  }

  getDraftService (): DatabaseDraftService {
    return this.draftService;
  }
}
