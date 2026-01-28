export interface SystemSetting {
  id: number;
  key: string;
  value: unknown;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingValue {
  key: string;
  value: unknown;
}

export interface SettingsUpdateRequest {
  settings: SettingValue[];
}

export interface SettingsResponse {
  id: string;
  label: string;
  description: string;
  value: boolean;
  category: string;
}