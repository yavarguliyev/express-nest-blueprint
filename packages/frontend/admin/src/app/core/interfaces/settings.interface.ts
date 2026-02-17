export interface SettingItem {
  id: string;
  label: string;
  description: string;
  value: boolean;
  isActive: boolean;
  category: string;
}

export interface SettingsUpdateRequest {
  settings: Array<{
    key: string;
    value: boolean;
    isActive?: boolean;
  }>;
}
