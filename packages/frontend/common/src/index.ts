// ============================================================================
// Domain - Types, Interfaces, Enums, Constants
// ============================================================================

// Enums
export * from './domain/enums/api.enum';
export * from './domain/enums/auth.enum';
export * from './domain/enums/status.enum';

// Interfaces
export * from './domain/interfaces/api.interface';
export * from './domain/interfaces/auth.interface';
export * from './domain/interfaces/common.interface';
export * from './domain/interfaces/database.interface';
export * from './domain/interfaces/draggable-position.interface';
export * from './domain/interfaces/field-config.interface';
export * from './domain/interfaces/notification.interface';
export * from './domain/interfaces/storage-data.interface';
export * from './domain/interfaces/toast.interface';
export * from './domain/interfaces/table-style.interface';

// Types
export * from './domain/types/api.type';
export * from './domain/types/error-response.type';
export * from './domain/types/form.type';
export * from './domain/types/state.type';
export * from './domain/types/toast.type';
export * from './domain/types/theme.type';

// Constants
export * from './domain/constants/api.const';
export * from './domain/constants/validation.const';
export * from './domain/constants/storage-keys.const';
export * from './domain/constants/validation-rules.const';
export * from './domain/constants/random-password.const';

// ============================================================================
// Core Services
// ============================================================================

// API Services
export * from './core/services/api/api-client.service';
export * from './core/services/api/rest-adapter.service';
export * from './core/services/api/graphql-adapter.service';

// State Management
export * from './core/services/state/storage.service';
export * from './core/services/state/loading-state.service';
export * from './core/services/state/base-draft.service';

// Notification Service
export * from './core/services/notification/notification.service';

// Configuration Service
export * from './core/services/config/config.service';

// UI Services
export * from './core/services/ui/loading.service';
export * from './core/services/ui/toast.service';
// Note: ThemeService is not exported to avoid JIT compiler issues with constructor parameters
// Each app should create its own theme service implementation

// Formatting Services
export * from './core/services/formatting/date-format.service';
export * from './core/services/formatting/text-transform.service';

// Table Services
export * from './core/services/table/pagination.service';
export * from './core/services/table/table-style.service';

// ============================================================================
// Guards
// ============================================================================

export * from './core/guards/auth.guard';
export * from './core/guards/role.guard';

// ============================================================================
// Interceptors
// ============================================================================

export * from './core/interceptors/auth.interceptor';
export * from './core/interceptors/error.interceptor';
export * from './core/interceptors/loading.interceptor';

// ============================================================================
// Directives
// ============================================================================

export * from './core/directives/click-outside.directive';
export * from './core/directives/auto-focus.directive';
export * from './core/directives/tooltip.directive';
export * from './core/directives/draggable-resizable.directive';

// ============================================================================
// Components
// ============================================================================

export * from './core/components/loading/loading.component';
export * from './core/components/toast/toast.component';
export * from './core/components/toggle-switch/toggle-switch.component';
export * from './core/components/password-input/password-input.component';

// ============================================================================
// Pipes
// ============================================================================

export * from './core/pipes/date-format.pipe';
export * from './core/pipes/text-transform.pipe';
export * from './core/pipes/safe-html.pipe';

// ============================================================================
// Utilities
// ============================================================================

// Date Utilities
export * from './utils/date/date.util';

// String Utilities
export * from './utils/string/string.util';

// Validation Utilities
export * from './utils/validation/validation.util';

// Notification Utilities
export * from './utils/notification/notification.util';
export * from './utils/notification/notification-helper.util';

// Form Utilities
export * from './utils/form/validators.util';
export * from './utils/form/form.util';
export * from './utils/form/form-validation.util';
