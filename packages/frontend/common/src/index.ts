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
export * from './domain/interfaces/notification.interface';

// Types
export * from './domain/types/api.type';
export * from './domain/types/form.type';
export * from './domain/types/state.type';

// Constants
export * from './domain/constants/api.const';
export * from './domain/constants/validation.const';

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

// Form Utilities
export * from './utils/form/validators.util';
export * from './utils/form/form.util';
