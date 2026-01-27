export const API_BASE = '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    BASE: `${API_BASE}/auth`,
    LOGIN: `${API_BASE}/auth/admin-login`,
    PROFILE: `${API_BASE}/admin/profile`,
    UPLOAD_AVATAR: `${API_BASE}/admin/profile/upload`,
    DELETE_AVATAR: `${API_BASE}/admin/profile/image`,
  },

  ADMIN: {
    BASE: `${API_BASE}/admin`,
    DASHBOARD_METRICS: `${API_BASE}/admin/dashboard/metrics`,
    HEALTH: `${API_BASE}/admin/health`,
    SCHEMA: `${API_BASE}/admin/crud/schema`,
    CRUD: (category: string, resource: string) => `${API_BASE}/admin/crud/${category}/${resource}`,
    CRUD_ID: (category: string, resource: string, id: string | number) =>
      `${API_BASE}/admin/crud/${category}/${resource}/${id}`,
    BULK_OPERATIONS: `${API_BASE}/admin/bulk-operations`,
    BULK_OPERATIONS_VALIDATE: `${API_BASE}/admin/bulk-operations/validate`,
  },
} as const;
