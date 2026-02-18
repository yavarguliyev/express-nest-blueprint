export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  // User fields
  firstName: 'FIRST NAME',
  lastName: 'LAST NAME',
  email: 'EMAIL ADDRESS',
  isActive: 'ACTIVE',
  isEmailVerified: 'VERIFIED EMAIL',
  profileImageUrl: 'PROFILE IMAGE',
  role: 'USER ROLE',
  id: 'ID',
  lastLogin: 'LAST LOGIN',

  // Common fields
  createdAt: 'CREATED DATE',
  updatedAt: 'LAST UPDATED',
  deletedAt: 'DELETED DATE',
  status: 'STATUS',
  name: 'NAME',
  description: 'DESCRIPTION',
  title: 'TITLE',
  content: 'CONTENT',
  type: 'TYPE',
  category: 'CATEGORY',
  priority: 'PRIORITY',
  tags: 'TAGS',

  // System fields
  userId: 'USER ID',
  adminId: 'ADMIN ID',
  sessionId: 'SESSION ID',
  ipAddress: 'IP ADDRESS',
  userAgent: 'USER AGENT',
  deviceType: 'DEVICE TYPE',
  browserName: 'BROWSER',
  operatingSystem: 'OPERATING SYSTEM',

  // Business fields
  companyName: 'COMPANY NAME',
  department: 'DEPARTMENT',
  position: 'POSITION',
  phoneNumber: 'PHONE NUMBER',
  address: 'ADDRESS',
  city: 'CITY',
  country: 'COUNTRY',
  zipCode: 'ZIP CODE',

  // Settings fields
  isEnabled: 'ENABLED',
  isVisible: 'VISIBLE',
  isPublic: 'PUBLIC',
  isPrivate: 'PRIVATE',
  isRead: 'READ',
  isEmpty: 'EMPTY',
  isCustomizable: 'CUSTOMIZABLE',
  isImportant: 'IMPORTANT',
  isSystemGradient: 'SYSTEM GRADIENT',
  allowEmails: 'EMAIL NOTIFICATIONS',
  allowSms: 'SMS NOTIFICATIONS',

  // Metrics fields
  totalUsers: 'TOTAL USERS',
  activeUsers: 'ACTIVE USERS',
  memoryUsage: 'MEMORY USAGE',
  cpuUsage: 'CPU USAGE',
  diskUsage: 'DISK USAGE',
  networkUsage: 'NETWORK USAGE',
  requestCount: 'REQUEST COUNT',
  errorCount: 'ERROR COUNT',
  responseTime: 'RESPONSE TIME'
} as const;

export const EXCLUDED_FIELDS = ['id', 'profileImageUrl', 'createdAt', 'updatedAt', 'lastLogin'] as const;

export const DISABLED_FIELDS = ['id', 'email', 'createdAt', 'updatedAt', 'lastLogin'] as const;

export const SENSITIVE_FIELDS = ['isActive', 'isEmailVerified'] as const;

export const ROLE_COLUMN_NAMES = ['role', 'user_role', 'userRole', 'account_role', 'accountRole', 'permission_level', 'permissionLevel'] as const;

export const SEARCHABLE_OBJECT_PROPS = ['name', 'title', 'label', 'value', 'text', 'description'] as const;
