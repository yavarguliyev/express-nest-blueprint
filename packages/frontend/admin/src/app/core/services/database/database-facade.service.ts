import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DatabaseOperationStrategy } from '../../interfaces/database-strategy.interface';
import { RestDatabaseStrategy } from '../strategies/rest-database.service';
import { GraphQLDatabaseStrategy } from '../strategies/graphql-database.service';
import { DatabaseDraftService } from './database-draft.service';
import { ToastService } from '../ui/toast.service';
import { Schema, TableMetadata, BulkOperationResponse } from '../../interfaces/database.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/common.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabaseFacadeService {
  private restStrategy = inject(RestDatabaseStrategy);
  private graphqlStrategy = inject(GraphQLDatabaseStrategy);
  private draftService = inject(DatabaseDraftService);
  private toastService = inject(ToastService);

  private _useGraphQL = signal(false);
  private _currentStrategy = signal<DatabaseOperationStrategy>(this.restStrategy);

  useGraphQL = this._useGraphQL.asReadonly();
  currentStrategy = this._currentStrategy.asReadonly();

  hasDrafts = computed(() => this.draftService.hasDrafts());
  draftCount = computed(() => this.draftService.draftCount());

  setStrategy (useGraphQL: boolean): void {
    this._useGraphQL.set(useGraphQL);
    this._currentStrategy.set(useGraphQL ? this.graphqlStrategy : this.restStrategy);
  }

  loadSchema (): Observable<ApiResponse<Schema>> {
    return this._currentStrategy().loadSchema();
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    return this._currentStrategy().loadTableData(table, page, limit, searchQuery);
  }

  publishChanges (): Observable<BulkOperationResponse> {
    const drafts = Array.from(this.draftService.drafts().values()).filter(draft => draft.hasChanges);

    if (drafts.length === 0) {
      this.toastService.info('No changes to publish');

      return of({
        success: true,
        results: [],
        summary: { total: 0, successful: 0, failed: 0 }
      });
    }

    return this.draftService.publishDrafts();
  }
}
