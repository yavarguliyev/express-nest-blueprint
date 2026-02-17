export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  THEME_EDITOR_DRAFTS: 'theme-editor-drafts',
  DATABASE_DRAFTS: 'database-drafts',
  DRAFT_STORAGE_VERSION: '1.0.0',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
