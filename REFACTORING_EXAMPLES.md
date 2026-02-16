# Refactoring Examples: Before & After

This document shows concrete examples of how the refactoring will simplify the codebase.

## Example 1: Draft Management Duplication

### Before (300+ lines duplicated)

**database-draft.service.ts:**
```typescript
@Injectable({ providedIn: 'root' })
export class DatabaseDraftService {
  private readonly DRAFT_STORAGE_KEY = 'database-drafts';
  private readonly STORAGE_VERSION = '1.0.0';
  private _drafts = signal<Map<string, DatabaseDraft>>(new Map());
  
  draftCount = computed(() => {
    const drafts = this._drafts();
    return Array.from(drafts.values()).filter(d => d.hasChanges).length;
  });
  
  hasDrafts = computed(() => this.draftCount() > 0);
  
  loadDraftsFromStorage(): void { /* 50 lines */ }
  saveDraftsToStorage(): void { /* 30 lines */ }
  resetDrafts(): void { /* 20 lines */ }
  publishDrafts(): Observable<BulkOperationResponse> { /* 40 lines */ }
}
```

**theme-editor.service.ts:**
```typescript
@Injectable({ providedIn: 'root' })
export class ThemeEditorService {
  private readonly DRAFT_STORAGE_KEY = 'theme-editor-drafts';
  private readonly STORAGE_VERSION = '1.0.0';
  private _drafts = signal<Map<string, TokenDraft>>(new Map());
  
  draftCount = computed(() => {
    const drafts = this._drafts();
    return Array.from(drafts.values()).filter(d => d.hasChanges).length;
  });
  
  hasDrafts = computed(() => this.draftCount() > 0);
  
  loadDraftsFromStorage(): void { /* 50 lines - IDENTICAL */ }
  saveDraftsToStorage(): void { /* 30 lines - IDENTICAL */ }
  resetDrafts(): void { /* 20 lines - IDENTICAL */ }
  publishDrafts(): Observable<ApiResponse<unknown>> { /* 40 lines - IDENTICAL */ }
}
```

### After (Single base class)

**base-draft.service.ts:**
```typescript
export abstract class BaseDraftService<TDraft, TOperation> {
  protected abstract readonly DRAFT_STORAGE_KEY: string;
  protected abstract readonly STORAGE_VERSION: string;
  
  protected _drafts = signal<Map<string, TDraft>>(new Map());
  protected _loading = signal(false);
  
  draftCount = computed(() => 
    Array.from(this._drafts().values()).filter(d => d.hasChanges).length
  );
  
  hasDrafts = computed(() => this.draftCount() > 0);
  
  protected abstract buildOperation(draft: TDraft): TOperation;
  
  loadDraftsFromStorage(): void { /* 50 lines - SHARED */ }
  saveDraftsToStorage(): void { /* 30 lines - SHARED */ }
  resetDrafts(): void { /* 20 lines - SHARED */ }
  publishDrafts(): Observable<PublishResult> { /* 40 lines - SHARED */ }
}
```

**database-draft.service.ts (simplified):**
```typescript
@Injectable({ providedIn: 'root' })
export class DatabaseDraftService extends BaseDraftService<DatabaseDraft, DatabaseOperation> {
  protected readonly DRAFT_STORAGE_KEY = 'database-drafts';
  protected readonly STORAGE_VERSION = '1.0.0';
  
  protected buildOperation(draft: DatabaseDraft): DatabaseOperation {
    return { /* 10 lines */ };
  }
  
  // Only database-specific methods here (30 lines)
}
```

**theme-editor.service.ts (simplified):**
```typescript
@Injectable({ providedIn: 'root' })
export class ThemeEditorService extends BaseDraftService<TokenDraft, TokenOperation> {
  protected readonly DRAFT_STORAGE_KEY = 'theme-editor-drafts';
  protected readonly STORAGE_VERSION = '1.0.0';
  
  protected buildOperation(draft: TokenDraft): TokenOperation {
    return { /* 10 lines */ };
  }
  
  // Only theme-specific methods here (40 lines)
}
```

**Result:** 300 lines → 150 lines (50% reduction)

---

## Example 2: Database Operations Duplication

### Before (4 methods doing same thing)

```typescript
@Injectable({ providedIn: 'root' })
export class DatabaseOperationsService {
  loadSchema(): Observable<ApiResponse<Schema>> {
    return this.http.get<ApiResponse<Schema>>(
      `${API_ENDPOINTS.ADMIN.SCHEMA}?t=${Date.now()}`
    );
  }
  
  refreshSchema(): Observable<ApiResponse<Schema>> {
    return this.http.get<ApiResponse<Schema>>(
      `${API_ENDPOINTS.ADMIN.SCHEMA}?t=${Date.now()}`
    );
  }
  
  loadSchemaWithCache(): Observable<ApiResponse<Schema>> {
    return this.http.get<ApiResponse<Schema>>(
      `${API_ENDPOINTS.ADMIN.SCHEMA}?t=${Date.now()}`
    );
  }
  
  refreshSchemaWithToast(): Observable<ApiResponse<Schema>> {
    return this.http.get<ApiResponse<Schema>>(
      `${API_ENDPOINTS.ADMIN.SCHEMA}?t=${Date.now()}`
    ).pipe(
      tap(res => {
        if (res.success) this.toastService.success('Schema refreshed');
        else this.toastService.error('Failed to refresh schema');
      })
    );
  }
  
  // Same pattern for loadTableData, refreshTableData, etc.
}
```

### After (1 flexible method)

```typescript
@Injectable({ providedIn: 'root' })
export class DatabaseOperationsService {
  loadSchema(options?: {
    refresh?: boolean;
    showToast?: boolean;
    useCache?: boolean;
  }): Observable<ApiResponse<Schema>> {
    const timestamp = options?.refresh !== false ? Date.now() : undefined;
    const url = timestamp 
      ? `${API_ENDPOINTS.ADMIN.SCHEMA}?t=${timestamp}`
      : API_ENDPOINTS.ADMIN.SCHEMA;
    
    return this.http.get<ApiResponse<Schema>>(url).pipe(
      tap(res => {
        if (options?.showToast) {
          res.success 
            ? this.toastService.success('Schema loaded')
            : this.toastService.error('Failed to load schema');
        }
      })
    );
  }
}

// Usage:
loadSchema()                          // Default behavior
loadSchema({ refresh: true })         // Force refresh
loadSchema({ showToast: true })       // With notification
loadSchema({ refresh: true, showToast: true })  // Both
```

**Result:** 4 methods → 1 method (75% reduction)

---

## Example 3: Component Simplification

### Before (600+ lines, 7 dependencies)

```typescript
@Component({ /* ... */ })
export class Database implements OnInit {
  private toastService = inject(ToastService);
  private dbOperations = inject(DatabaseOperationsService);
  private gqlDbOperations = inject(GqlDatabaseOperationsService);
  private dbHelper = inject(DatabaseHelperService);
  private dbForm = inject(DatabaseFormService);
  private pagination = inject(PaginationService);
  draftService = inject(DatabaseDraftService);
  
  ngOnInit(): void {
    this.loadSchema();
    this.setupSearchDebounce();
    this.initializeDrafts();
  }
  
  loadSchema(): void {
    this.loadingSchema.set(true);
    const service = this.useGraphQL() ? this.gqlDbOperations : this.dbOperations;
    service.loadSchema().subscribe({
      next: (response) => {
        if (response.success) {
          this.schema.set(response.data);
          this.toastService.success('Schema loaded');
        } else {
          this.toastService.error('Failed to load schema');
        }
        this.loadingSchema.set(false);
      },
      error: (error) => {
        this.toastService.error(error.message);
        this.loadingSchema.set(false);
      }
    });
  }
  
  loadTableData(): void { /* 50 lines */ }
  updateRecord(): void { /* 60 lines */ }
  deleteRecord(): void { /* 40 lines */ }
  publishChanges(): void { /* 50 lines */ }
  // ... 400 more lines
}
```

### After (200 lines, 1 dependency)

```typescript
@Component({ 
  providers: [DatabaseFacade]
})
export class Database implements OnInit {
  facade = inject(DatabaseFacade);
  
  // Only UI state
  showUpdateModal = signal(false);
  selectedRecord = signal<Record<string, unknown> | null>(null);
  
  ngOnInit(): void {
    this.facade.initialize();
  }
  
  // Delegate to facade
  loadSchema(): void {
    this.facade.loadSchema().subscribe();
  }
  
  loadTableData(): void {
    this.facade.loadTableData(this.selectedTable()).subscribe();
  }
  
  updateRecord(data: Record<string, unknown>): void {
    this.facade.updateRecord(data).subscribe(() => {
      this.showUpdateModal.set(false);
    });
  }
  
  // ... 150 more lines (UI logic only)
}
```

**database.facade.ts (new):**
```typescript
@Injectable()
export class DatabaseFacade {
  private api = inject(ApiService);
  private draft = inject(DatabaseDraftService);
  private formatting = inject(DatabaseFormattingService);
  private business = inject(DatabaseBusinessService);
  
  loadSchema(): Observable<Schema> {
    return this.api.get<Schema>(API_ENDPOINTS.ADMIN.SCHEMA).pipe(
      tap(schema => this.handleSchemaLoaded(schema))
    );
  }
  
  loadTableData(table: TableMetadata): Observable<TableData> {
    return this.api.get<PaginatedResponse<Record<string, unknown>>>(
      this.buildTableDataUrl(table)
    ).pipe(
      map(response => this.formatting.formatTableData(response))
    );
  }
  
  updateRecord(data: Record<string, unknown>): Observable<void> {
    const validation = this.business.validateRecord(data);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }
    
    return this.api.put(/* ... */).pipe(
      tap(() => this.draft.removeDraft(data.id))
    );
  }
  
  // ... orchestration logic
}
```

**Result:** 600 lines → 200 (component) + 150 (facade) = 350 total (42% reduction)

---

## Example 4: API Service Unification

### Before (Duplicated REST + GraphQL)

**database-operations.service.ts:**
```typescript
@Injectable({ providedIn: 'root' })
export class DatabaseOperationsService {
  private http = inject(HttpClient);
  
  loadSchema(): Observable<ApiResponse<Schema>> {
    return this.http.get<ApiResponse<Schema>>(API_ENDPOINTS.ADMIN.SCHEMA);
  }
  
  updateRecord(table: TableMetadata, id: number, data: Record<string, unknown>): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(
      `${API_ENDPOINTS.ADMIN.TABLE_DATA}/${table.category}/${table.name}/${id}`,
      data
    );
  }
}
```

**gql-database-operations.service.ts (130 lines):**
```typescript
@Injectable({ providedIn: 'root' })
export class GqlDatabaseOperationsService {
  private http = inject(HttpClient);
  private readonly GQL_URL = '/admin/graphql';
  
  loadSchema(): Observable<ApiResponse<Schema>> {
    const query = `query { adminGetSchema }`;
    return this.http.post<GqlResponse<{ adminGetSchema: Schema }>>(
      this.GQL_URL, 
      { query }
    ).pipe(
      map(res => ({
        success: !res.errors,
        data: res.data?.adminGetSchema as Schema,
        message: res.errors?.[0]?.message ?? ''
      }))
    );
  }
  
  updateRecord(/* ... */): Observable<ApiResponse<unknown>> {
    const query = `mutation($data: JSONObject!) { adminUpdateRecord(data: $data) }`;
    return this.http.post<GqlResponse<unknown>>(
      this.GQL_URL,
      { query, variables: { data } }
    ).pipe(
      map(res => ({
        success: !res.errors,
        data: res.data,
        message: res.errors?.[0]?.message ?? ''
      }))
    );
  }
}
```

### After (Unified API Service)

**api.service.ts:**
```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private config = inject(ApiConfigService);
  
  get<T>(endpoint: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.config.useGraphQL
      ? this.graphqlGet<T>(endpoint, options)
      : this.restGet<T>(endpoint, options);
  }
  
  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.config.useGraphQL
      ? this.graphqlMutation<T>('update', endpoint, body, options)
      : this.restPut<T>(endpoint, body, options);
  }
  
  graphql<T>(query: string, variables?: Record<string, unknown>): Observable<ApiResponse<T>> {
    return this.http.post<GqlResponse<T>>(this.config.graphqlUrl, { query, variables }).pipe(
      map(res => this.mapGqlResponse(res)),
      catchError(err => this.handleError(err))
    );
  }
  
  private mapGqlResponse<T>(res: GqlResponse<T>): ApiResponse<T> {
    return {
      success: !res.errors,
      data: res.data as T,
      message: res.errors?.[0]?.message ?? ''
    };
  }
}
```

**Usage (same for REST or GraphQL):**
```typescript
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private api = inject(ApiService);
  
  loadSchema(): Observable<ApiResponse<Schema>> {
    return this.api.get<Schema>(API_ENDPOINTS.ADMIN.SCHEMA);
  }
  
  updateRecord(table: TableMetadata, id: number, data: Record<string, unknown>): Observable<ApiResponse<unknown>> {
    return this.api.put(
      `${API_ENDPOINTS.ADMIN.TABLE_DATA}/${table.category}/${table.name}/${id}`,
      data
    );
  }
}
```

**Result:** 
- Delete GqlDatabaseOperationsService (130 lines)
- Unified API layer (80 lines)
- Net reduction: 50 lines + simplified usage

---

## Example 5: Form Validation Consolidation

### Before (Scattered validation)

**database-form.service.ts:**
```typescript
validateAndSubmitCreate(data: Record<string, unknown>): Observable<ApiResponse<unknown>> {
  if (!data['email'] || data['email'] === '') {
    this.toastService.error('Email is required');
    return throwError(() => new Error('Email is required'));
  }
  
  if (!data['password'] || (data['password'] as string).length < 8) {
    this.toastService.error('Password must be at least 8 characters');
    return throwError(() => new Error('Invalid password'));
  }
  
  if (data['password'] !== data['confirmPassword']) {
    this.toastService.error('Passwords do not match');
    return throwError(() => new Error('Passwords do not match'));
  }
  
  if (!data['role'] || data['role'] === '') {
    this.toastService.error('Role is required');
    return throwError(() => new Error('Role is required'));
  }
  
  // ... 40 more lines
}

validateAndSubmitUpdate(data: Record<string, unknown>): Observable<ApiResponse<unknown>> {
  // 70% duplicate validation logic
  if (!data['email'] || data['email'] === '') {
    this.toastService.error('Email is required');
    return throwError(() => new Error('Email is required'));
  }
  
  if (data['password'] && (data['password'] as string).length < 8) {
    this.toastService.error('Password must be at least 8 characters');
    return throwError(() => new Error('Invalid password'));
  }
  
  // ... 40 more lines
}
```

### After (Utility-based validation)

**form-validation.util.ts:**
```typescript
export class FormValidationUtil {
  static validateEmail(email: unknown): ValidationResult {
    if (!email || email === '') {
      return { valid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email as string)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  }
  
  static validatePassword(password: string, confirmPassword?: string): ValidationResult {
    if (!password || password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' };
    }
    return { valid: true };
  }
  
  static validateRole(role: unknown): ValidationResult {
    if (!role || role === '') {
      return { valid: false, error: 'Role is required' };
    }
    const validRoles = ['global admin', 'admin', 'moderator', 'user'];
    if (!validRoles.includes(role as string)) {
      return { valid: false, error: 'Invalid role' };
    }
    return { valid: true };
  }
  
  static validateRecord(
    data: Record<string, unknown>,
    rules: ValidationRules
  ): ValidationResult {
    for (const [field, validators] of Object.entries(rules)) {
      for (const validator of validators) {
        const result = validator(data[field]);
        if (!result.valid) return result;
      }
    }
    return { valid: true };
  }
}
```

**database-form.service.ts (simplified):**
```typescript
validateAndSubmit(
  operation: 'create' | 'update',
  data: Record<string, unknown>
): Observable<ApiResponse<unknown>> {
  const rules: ValidationRules = {
    email: [FormValidationUtil.validateEmail],
    password: operation === 'create' 
      ? [(val) => FormValidationUtil.validatePassword(val as string, data['confirmPassword'] as string)]
      : [],
    role: [FormValidationUtil.validateRole]
  };
  
  const validation = FormValidationUtil.validateRecord(data, rules);
  if (!validation.valid) {
    this.toastService.error(validation.error);
    return throwError(() => new Error(validation.error));
  }
  
  return operation === 'create'
    ? this.api.post(API_ENDPOINTS.ADMIN.CREATE, data)
    : this.api.put(API_ENDPOINTS.ADMIN.UPDATE, data);
}
```

**Result:** 
- 2 methods → 1 method
- 120 lines → 40 lines (67% reduction)
- Reusable validation logic

---

## Summary of Improvements

| Refactoring | Lines Before | Lines After | Reduction |
|-------------|--------------|-------------|-----------|
| Draft Management | 300 | 150 | 50% |
| Database Operations | 200 | 100 | 50% |
| Database Component | 600 | 350 | 42% |
| API Services | 260 | 150 | 42% |
| Form Validation | 120 | 40 | 67% |
| **Total** | **1,480** | **790** | **47%** |

## Key Patterns Applied

1. **Inheritance:** Base classes for common behavior
2. **Composition:** Facade pattern for complex orchestration
3. **Utility Functions:** Pure functions for reusable logic
4. **Options Pattern:** Flexible methods instead of multiple variants
5. **Single Responsibility:** Each service has one clear purpose
6. **DRY Principle:** Eliminate all code duplication
