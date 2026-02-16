export const FIELD_NAMES = {
  ID: 'id',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  PASSWORD: 'password',
  EMAIL: 'email',
  ROLE: 'role',
  USERNAME: 'username',
  AVATAR_URL: 'avatarUrl',
  BIO: 'bio',
  FULL_NAME: 'fullName',
} as const;

export const EXCLUDED_UPDATE_FIELDS = [
  FIELD_NAMES.ID,
  FIELD_NAMES.CREATED_AT,
  FIELD_NAMES.UPDATED_AT,
] as const;

export const SENSITIVE_FIELDS = [FIELD_NAMES.PASSWORD] as const;

export const ROLE_FIELDS = [FIELD_NAMES.ROLE] as const;

export const IMAGE_FIELDS = [FIELD_NAMES.AVATAR_URL] as const;

export const DATE_FIELDS = [FIELD_NAMES.CREATED_AT, FIELD_NAMES.UPDATED_AT] as const;
