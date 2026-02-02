export const CACHE_TTL_SHORT = 30;
export const CACHE_TTL_1_MIN = 60;
export const CACHE_TTL_5_MIN = 300;
export const CACHE_TTL_15_MIN = 900;
export const CACHE_TTL_30_MIN = 1800;
export const CACHE_TTL_1_HOUR = 3600;
export const CACHE_TTL_1_DAY = 86400;

export const CACHE_KEYS = {
  SETTINGS: 'system:all_settings',
  USER_LIST: 'users:list',
  USER_PROFILE: (id: string | number) => `users:profile:${id}`,
  THEMES: 'system:themes'
} as const;
