import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToastService } from '../../core/services/ui/toast.service';
import { DatabaseDraftService } from '../../core/services/database/database-draft.service';
import { DatabasePublishService } from '../../core/services/database/database-publish.service';
import { DatabaseRecordService } from '../../core/services/database/database-record.service';
import { DatabaseTableService } from '../../core/services/database/database-table.service';
import { Column } from '../../core/interfaces/database.interface';
import { PasswordUtilityService } from '../../core/services/utilities/password-utility.service';
import { DatabaseModalManagerService } from './database-modal-manager.service';
import { DatabaseDelegationService } from './database-delegation.service';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';
import { DraftStatusBar } from '../../shared/components/draft-status-bar/draft-status-bar';
import { DraftStatusConfig } from '../../core/interfaces/theme.interface';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { PasswordInput } from '../../shared/components/password-input/password-input';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitch, ActionButtons, DraftStatusBar, DraggableResizableDirective, PasswordInput],
  templateUrl: './database.html',
  styleUrl: './database.css'
})
export class Database implements OnInit, AfterViewInit {
  @ViewChild('tableScrollContainer') tableScrollContainer!: ElementRef<HTMLDivElement>;

  private toastService = inject(ToastService);
  private passwordUtility = inject(PasswordUtilityService);
  private dbPublish = inject(DatabasePublishService);
  readonly delegate = inject(DatabaseDelegationService);
  readonly modal = inject(DatabaseModalManagerService);
  readonly draftService = inject(DatabaseDraftService);
  readonly recordService = inject(DatabaseRecordService);
  readonly tableService = inject(DatabaseTableService);
  readonly isPublishing = signal(false);
  readonly Math = Math;
  readonly useGraphQL = this.tableService.useGraphQL;
  readonly schema = this.tableService.schema;
  readonly loadingSchema = this.tableService.loadingSchema;
  readonly loadingData = this.tableService.loadingData;
  readonly expandedCategories = this.tableService.expandedCategories;
  readonly selectedTable = this.tableService.selectedTable;
  readonly tableData = this.tableService.tableData;
  readonly total = this.tableService.total;
  readonly page = this.tableService.page;
  readonly searchQuery = this.tableService.searchQuery;

  readonly draftStatusConfig = computed<DraftStatusConfig>(() => ({
    draftCount: this.draftService.draftCount(),
    hasDrafts: this.draftService.hasDrafts(),
    affectedItems: this.draftService.affectedTables(),
    isProcessing: this.isPublishing(),
    itemType: 'table',
    resetButtonText: 'Reset All',
    saveButtonText: 'Save Changes',
    resetButtonIcon: 'refresh',
    saveButtonIcon: 'save'
  }));

  get totalPages (): number {
    return this.tableService.totalPages();
  }

  get pages (): number[] {
    return this.tableService.pages();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey (event: KeyboardEvent): void {
    if (this.modal.showUpdateModal()) {
      this.modal.closeModal();
      event.preventDefault();
    }
  }

  ngOnInit (): void {
    if (window.location.pathname.includes('/database')) this.tableService.loadSchema();
  }

  ngAfterViewInit (): void {
    this.tableService.setupScrollIndicators(this.tableScrollContainer);
  }

  createRecord (): void {
    const table = this.selectedTable();
    if (table) this.modal.openCreateModal(table);
  }

  updateRecord (id: number): void {
    const table = this.selectedTable();
    const record = this.tableData().find(row => row['id'] === id);
    if (table && record) this.modal.openUpdateModal(table, record);
  }

  submitForm (): void {
    const table = this.selectedTable();
    if (!table) return;
    if (this.modal.submitForm(table)) this.modal.closeModal();
  }

  generatePassword (): void {
    this.modal.updateFormField('password', this.passwordUtility.generatePassword());
  }

  deleteRecord (id: number): void {
    const table = this.selectedTable();
    if (table) this.recordService.deleteRecord({ table, id, tableData: this.tableData() });
  }

  updateBooleanValue (record: Record<string, unknown>, column: Column, newValue: boolean): void {
    const table = this.selectedTable();
    if (table) this.recordService.updateBooleanValue({ table, record, column, newValue });
  }

  getBooleanValue (r: Record<string, unknown>, c: string): boolean {
    const table = this.selectedTable();
    return table
      ? this.recordService.getBooleanValue({ record: r, column: c, table, getNumberValue: (rec, col) => this.delegate.getNumberValue(rec, col) })
      : (r[c] as boolean);
  }

  publishAllChanges (): void {
    this.dbPublish.publishAllChanges(
      this.draftService.hasDrafts(),
      value => this.isPublishing.set(value),
      () => this.tableService.loadTableData(() => this.tableService.resetTableScroll(this.tableScrollContainer))
    );
  }

  resetAllChanges (): void {
    this.dbPublish.resetAllChanges(this.draftService.hasDrafts(), this.draftService.draftCount(), () =>
      this.tableService.loadTableData(() => this.tableService.resetTableScroll(this.tableScrollContainer))
    );
  }

  handleImageClick (row: Record<string, unknown>, columnName: string): void {
    const imageUrl = row[columnName] as string;
    if (imageUrl?.trim()) window.open(imageUrl, '_blank');
    else this.toastService.info('No image available.');
  }
}
