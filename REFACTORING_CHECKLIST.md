# Refactoring Implementation Checklist

Use this checklist to track progress through the refactoring process.

## 🚀 Pre-Refactoring Setup

- [ ] Create feature branch: `refactor/admin-simplification`
- [ ] Backup current working state
- [ ] Document current behavior (take screenshots)
- [ ] Run full test suite and verify all pass
- [ ] Run `npm run lint` and verify no violations
- [ ] Run `npm run build` and verify successful build
- [ ] Manual test all features and document results
- [ ] Set up testing environment

---

## 📦 Phase 1: Foundation (Week 1)

### 1.1 Base Draft Service (45 min) ⭐⭐⭐

- [ ] Create `src/app/core/services/base/base-draft.service.ts`
- [ ] Implement abstract base class with common draft logic
- [ ] Add computed signals: `draftCount`, `hasDrafts`, `affectedItems`
- [ ] Add methods: `loadDraftsFromStorage`, `saveDraftsToStorage`, `resetDrafts`, `publishDrafts`
- [ ] Update `DatabaseDraftService` to extend `BaseDraftService`
- [ ] Update `ThemeEditorService` to extend `BaseDraftService`
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: Database drafts (create, save, publish, reset)
- [ ] Manual test: Theme editor drafts (create, save, publish, reset)
- [ ] Commit: `refactor: extract base draft service`

**Expected Result:** 250 lines eliminated, both services working identically

### 1.2 Consolidate Database Operations (30 min) ⭐⭐⭐

- [ ] Open `src/app/core/services/database-operations.service.ts`
- [ ] Create new `loadSchema(options?: { refresh?, showToast?, useCache? })` method
- [ ] Remove `refreshSchema()` method
- [ ] Remove `loadSchemaWithCache()` method
- [ ] Remove `refreshSchemaWithToast()` method
- [ ] Create new `loadTableData(table, page, limit, search, options?)` method
- [ ] Remove `refreshTableData()` method
- [ ] Remove `loadTableDataWithCache()` method
- [ ] Remove `refreshTableDataWithToast()` method
- [ ] Update all call sites in `Database` component
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: Load schema, refresh schema
- [ ] Manual test: Load table data, refresh table data
- [ ] Commit: `refactor: consolidate database operations`

**Expected Result:** 10 methods → 6 methods, 150 lines eliminated

### 1.3 Form Validation Utility (35 min) ⭐⭐

- [ ] Create `src/app/core/utils/form-validation.util.ts`
- [ ] Implement `validateEmail(email)` method
- [ ] Implement `validatePassword(password, confirmPassword?)` method
- [ ] Implement `validateRole(role)` method
- [ ] Implement `validateRequiredFields(data, required)` method
- [ ] Implement `validateRecord(data, rules)` method
- [ ] Implement `hasChanges(current, original)` method
- [ ] Implement `getChangedFields(current, original)` method
- [ ] Update `DatabaseFormService` to use utility methods
- [ ] Consolidate `validateAndSubmitCreate` and `validateAndSubmitUpdate` into single method
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: Create user with validation
- [ ] Manual test: Update user with validation
- [ ] Manual test: Invalid email, password, role
- [ ] Commit: `refactor: extract form validation utility`

**Expected Result:** 120 lines → 40 lines in service, reusable validation

### 1.4 API Service Abstraction (60 min) ⭐⭐⭐

- [ ] Create `src/app/core/services/base/api.service.ts`
- [ ] Create `src/app/core/interfaces/api.interface.ts`
- [ ] Implement `get<T>(endpoint, options?)` method
- [ ] Implement `post<T>(endpoint, body, options?)` method
- [ ] Implement `put<T>(endpoint, body, options?)` method
- [ ] Implement `delete<T>(endpoint, options?)` method
- [ ] Implement `graphql<T>(query, variables?)` method
- [ ] Add error handling and response mapping
- [ ] Update `DatabaseOperationsService` to use `ApiService`
- [ ] Update `ThemeEditorService` to use `ApiService`
- [ ] Update `SettingsService` to use `ApiService`
- [ ] Delete `GqlDatabaseOperationsService` (no longer needed)
- [ ] Update `Database` component to remove GraphQL toggle (handled by ApiService)
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: All database operations (REST mode)
- [ ] Manual test: All database operations (GraphQL mode)
- [ ] Manual test: Theme editor operations
- [ ] Manual test: Settings operations
- [ ] Commit: `refactor: create unified api service`

**Expected Result:** GqlDatabaseOperationsService deleted (130 lines), unified API layer

### Phase 1 Validation

- [ ] All Phase 1 tasks completed
- [ ] No ESLint violations
- [ ] No Prettier violations
- [ ] Build successful
- [ ] All manual tests pass
- [ ] Code duplication reduced by ~500 lines
- [ ] Ready for Phase 2

---

## 🔧 Phase 2: Service Layer (Week 2)

### 2.1 Merge Database Helper Services (90 min) ⭐⭐

- [ ] Create `src/app/core/services/database-formatting.service.ts`
- [ ] Move formatting methods from `DatabaseHelperService`
  - [ ] `formatValue()`
  - [ ] `formatFieldValue()`
  - [ ] `getUserInitials()`
  - [ ] `getFieldDisplayName()`
- [ ] Create `src/app/core/services/database-business.service.ts`
- [ ] Move business logic from `DatabaseHelperService`
  - [ ] `canDeleteRecord()`
  - [ ] `canModifySensitiveFields()`
  - [ ] `hasAnyActions()`
  - [ ] `isSensitiveField()`
- [ ] Rename `DatabaseOperationsService` to `DatabaseApiService`
- [ ] Update all imports in components
- [ ] Delete `DatabaseHelperService`
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: All database operations
- [ ] Manual test: Field formatting
- [ ] Manual test: Permission checks
- [ ] Commit: `refactor: reorganize database services`

**Expected Result:** Clear separation of concerns, easier to test

### 2.2 Role-Based Access Service (25 min) ⭐⭐

- [ ] Create `src/app/core/services/role-access.service.ts`
- [ ] Implement `canEditRoles()` method
- [ ] Implement `isGlobalAdmin()` method
- [ ] Implement `canDeleteRecords()` method
- [ ] Implement `canModifySensitiveFields()` method
- [ ] Implement `getRoleDisplayName(role)` method
- [ ] Implement `getAvailableRoles()` method
- [ ] Implement `hasPermission(permission)` method
- [ ] Update `DatabaseBusinessService` to use `RoleAccessService`
- [ ] Update `DatabaseFormService` to use `RoleAccessService`
- [ ] Update `Database` component to use `RoleAccessService`
- [ ] Update `Profile` component to use `RoleAccessService`
- [ ] Remove direct `UserRoleHelper` calls
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: Role-based permissions
- [ ] Manual test: Global admin actions
- [ ] Manual test: Regular user restrictions
- [ ] Commit: `refactor: create role access service`

**Expected Result:** Centralized role logic, 15+ scattered checks eliminated

### 2.3 Notification Patterns (20 min) ⭐

- [ ] Create `src/app/core/utils/notification.util.ts`
- [ ] Implement `recordCreated(service, recordType?)` method
- [ ] Implement `recordUpdated(service, recordType?)` method
- [ ] Implement `recordDeleted(service, recordType?)` method
- [ ] Implement `operationFailed(service, operation, error)` method
- [ ] Implement `confirmDelete(service, callback, itemName?)` method
- [ ] Implement `publishSuccess(service, count)` method
- [ ] Implement `publishFailed(service, successful, failed)` method
- [ ] Update services to use notification utility
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: Create/update/delete notifications
- [ ] Manual test: Error notifications
- [ ] Manual test: Confirmation dialogs
- [ ] Commit: `refactor: extract notification patterns`

**Expected Result:** Consistent messaging, 50+ repeated calls eliminated

### 2.4 Field Configuration Service (30 min) ⭐⭐

- [ ] Create `src/app/core/services/field-config.service.ts`
- [ ] Create `src/app/core/interfaces/field-config.interface.ts`
- [ ] Define field configuration constants
  - [ ] Excluded fields
  - [ ] Sensitive fields
  - [ ] Role fields
  - [ ] Image fields
  - [ ] Date fields
- [ ] Implement `isExcludedFromUpdate(fieldName)` method
- [ ] Implement `isSensitiveField(fieldName)` method
- [ ] Implement `isEditableField(fieldName, userRole)` method
- [ ] Implement `isRequiredField(fieldName, tableName)` method
- [ ] Implement `getFieldType(fieldName)` method
- [ ] Implement `isImageField(fieldName)` method
- [ ] Implement `isRoleField(fieldName)` method
- [ ] Update `DatabaseFormService` to use `FieldConfigService`
- [ ] Update `DatabaseBusinessService` to use `FieldConfigService`
- [ ] Update `Database` component to use `FieldConfigService`
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: Field exclusion logic
- [ ] Manual test: Sensitive field restrictions
- [ ] Manual test: Role field handling
- [ ] Commit: `refactor: create field config service`

**Expected Result:** Single source of truth for field rules

### Phase 2 Validation

- [ ] All Phase 2 tasks completed
- [ ] No ESLint violations
- [ ] No Prettier violations
- [ ] Build successful
- [ ] All manual tests pass
- [ ] Service layer simplified and organized
- [ ] Ready for Phase 3

---

## 🎨 Phase 3: Components & Polish (Week 3)

### 3.1 Database Component Simplification (120 min) ⭐⭐⭐

- [ ] Create `src/app/features/database/database.facade.ts`
- [ ] Implement facade methods:
  - [ ] `initialize()`
  - [ ] `loadSchema()`
  - [ ] `loadTableData(table, page)`
  - [ ] `updateRecord(record)`
  - [ ] `deleteRecord(id)`
  - [ ] `publishChanges()`
  - [ ] `resetChanges()`
- [ ] Update `Database` component to use facade
- [ ] Remove direct service injections (keep only facade)
- [ ] Move business logic to facade
- [ ] Keep only UI logic in component
- [ ] Consider extracting sub-components:
  - [ ] `TableViewComponent` (optional)
  - [ ] `RecordFormComponent` (optional)
  - [ ] `SchemaSidebarComponent` (optional)
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: All database operations
- [ ] Manual test: Schema loading
- [ ] Manual test: Table data loading
- [ ] Manual test: CRUD operations
- [ ] Manual test: Draft management
- [ ] Commit: `refactor: simplify database component with facade`

**Expected Result:** 600 lines → 200 lines, 7 dependencies → 1

### 3.2 Draft Status Logic (25 min) ⭐

- [ ] Create `src/app/core/services/draft-status-manager.service.ts`
- [ ] Implement `createConfig(draftService, options)` method
- [ ] Implement `handlePublish(draftService)` method
- [ ] Implement `handleReset(draftService)` method
- [ ] Update `Database` component to use manager
- [ ] Update `Layout` component to use manager
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Manual test: Draft status bar in database
- [ ] Manual test: Draft status bar in layout
- [ ] Commit: `refactor: extract draft status manager`

**Expected Result:** Reusable draft status logic

### 3.3 Type Safety Improvements (15 min) ⭐

- [ ] Create `src/app/core/interfaces/api-response.interface.ts`
- [ ] Move `ApiResponse<T>` interface
- [ ] Move `PaginatedResponse<T>` interface
- [ ] Move `GqlResponse<T>` interface
- [ ] Update all services to import from shared file
- [ ] Remove duplicate interface definitions
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Commit: `refactor: consolidate shared interfaces`

**Expected Result:** Single source of truth for types

### 3.4 Shared Constants (20 min) ⭐

- [ ] Create `src/app/core/constants/field-names.const.ts`
- [ ] Create `src/app/core/constants/storage-keys.const.ts`
- [ ] Create `src/app/core/constants/validation-rules.const.ts`
- [ ] Extract magic strings to constants
- [ ] Update services to use constants
- [ ] Run `npm run lint` - verify no violations
- [ ] Run `npm run build` - verify successful
- [ ] Commit: `refactor: extract shared constants`

**Expected Result:** No magic strings, type-safe references

### Phase 3 Validation

- [ ] All Phase 3 tasks completed
- [ ] No ESLint violations
- [ ] No Prettier violations
- [ ] Build successful
- [ ] All manual tests pass
- [ ] Components simplified
- [ ] Ready for testing & documentation

---

## 🧪 Phase 4: Testing & Documentation

### 4.1 Unit Tests (60 min)

- [ ] Test `FormValidationUtil`
  - [ ] Test email validation
  - [ ] Test password validation
  - [ ] Test role validation
  - [ ] Test form changes detection
- [ ] Test `NotificationUtil`
  - [ ] Test success messages
  - [ ] Test error messages
  - [ ] Test confirmation dialogs
- [ ] Test `BaseDraftService`
  - [ ] Test draft creation
  - [ ] Test draft storage
  - [ ] Test draft publishing
  - [ ] Test draft reset
- [ ] Test `FieldConfigService`
  - [ ] Test field exclusion
  - [ ] Test sensitive fields
  - [ ] Test field types
- [ ] Run `npm test` - verify 80%+ coverage
- [ ] Commit: `test: add unit tests for utilities`

### 4.2 Integration Tests (90 min)

- [ ] Test `DatabaseFacade`
  - [ ] Test schema loading
  - [ ] Test table data loading
  - [ ] Test CRUD operations
  - [ ] Test draft management
- [ ] Test `ApiService`
  - [ ] Test REST operations
  - [ ] Test GraphQL operations
  - [ ] Test error handling
- [ ] Test `RoleAccessService`
  - [ ] Test permission checks
  - [ ] Test role validation
- [ ] Run `npm test` - verify all pass
- [ ] Commit: `test: add integration tests`

### 4.3 Documentation (45 min)

- [ ] Create `docs/ARCHITECTURE.md`
  - [ ] Service layer overview
  - [ ] Component structure
  - [ ] Data flow diagrams
- [ ] Create `docs/SERVICES.md`
  - [ ] Service responsibilities
  - [ ] Service dependencies
  - [ ] Usage examples
- [ ] Create `docs/PATTERNS.md`
  - [ ] Common patterns
  - [ ] Best practices
  - [ ] Code examples
- [ ] Update `README.md`
  - [ ] Architecture section
  - [ ] Development guidelines
- [ ] Commit: `docs: update architecture documentation`

### Phase 4 Validation

- [ ] All tests pass
- [ ] 80%+ code coverage
- [ ] Documentation complete
- [ ] Ready for final review

---

## ✅ Final Validation

### Code Quality

- [ ] Run `npm run lint` - no violations
- [ ] Run `npm run build` - successful
- [ ] Run `npm test` - all pass
- [ ] Code coverage ≥ 80%
- [ ] No console errors
- [ ] No console warnings

### Functionality

- [ ] Login/logout works
- [ ] Dashboard loads
- [ ] Database CRUD operations work
- [ ] Draft save/publish/reset works
- [ ] Theme editor works
- [ ] Settings work
- [ ] Profile works
- [ ] Health check works
- [ ] GraphQL playground works
- [ ] Role-based permissions work

### Performance

- [ ] Initial load time ≤ before
- [ ] Navigation speed ≤ before
- [ ] API response time ≤ before
- [ ] Bundle size ≤ before

### Metrics

- [ ] Total lines reduced by 30%+
- [ ] Code duplication reduced by 60%+
- [ ] Database component < 300 lines
- [ ] Service dependencies < 3 per component

---

## 🎉 Completion

- [ ] All phases completed
- [ ] All tests pass
- [ ] All manual tests pass
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Performance validated
- [ ] Ready to merge

### Final Steps

- [ ] Create pull request
- [ ] Request code review
- [ ] Address review comments
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Validate in staging
- [ ] Deploy to production
- [ ] Monitor for issues

---

## 📊 Results Summary

Fill in after completion:

```
Code Reduction:
- Before: _____ lines
- After: _____ lines
- Reduction: _____%

Service Count:
- Before: 20 services
- After: _____ services
- Reduction: _____%

Database Component:
- Before: 600 lines
- After: _____ lines
- Reduction: _____%

Test Coverage:
- Before: 0%
- After: _____%

Time Spent:
- Estimated: 15 days
- Actual: _____ days
```

---

**Note:** Check off items as you complete them. Commit after each major milestone. Test thoroughly before moving to next phase.
