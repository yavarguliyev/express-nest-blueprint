export const API_BASE = '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    BASE: `${API_BASE}/auth`,
    LOGIN: `${API_BASE}/auth/admin-login`,
    PROFILE: `${API_BASE}/admin/profile`,
    UPLOAD_AVATAR: `${API_BASE}/admin/profile/upload`,
    DELETE_AVATAR: `${API_BASE}/admin/profile/image`,
  },
  NOTIFICATIONS: {
    BASE: `${API_BASE}/notifications`,
    UNREAD_COUNT: `${API_BASE}/notifications/unread-count`,
    MARK_AS_READ: (id: number | string) => `${API_BASE}/notifications/${id}/read`,
    MARK_ALL_AS_READ: `${API_BASE}/notifications/read-all`,
    DELETE: (id: number | string) => `${API_BASE}/notifications/${id}`,
    DELETE_ALL: `${API_BASE}/notifications/all`,
    STREAM: `${API_BASE}/notifications/stream`,
  },
  ADMIN: {
    BASE: `${API_BASE}/admin`,
    DASHBOARD_METRICS: `${API_BASE}/admin/dashboard/metrics`,
    HEALTH: `${API_BASE}/admin/health`,
    SCHEMA: `${API_BASE}/admin/crud/schema`,
    CRUD: (category: string, resource: string) => `${API_BASE}/admin/crud/${category}/${resource}`,
    CRUD_ID: (category: string, resource: string, id: string | number) => `${API_BASE}/admin/crud/${category}/${resource}/${id}`,
  },
} as const;
