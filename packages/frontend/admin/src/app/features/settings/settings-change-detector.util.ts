import { SettingItem } from '../../core/interfaces/common.interface';

export class SettingsChangeDetector {
  static hasChanges (current: SettingItem[], original: SettingItem[]): boolean {
    if (current.length !== original.length) return false;

    return current.some(setting => {
      const originalSetting = original.find(orig => orig.id === setting.id);
      return originalSetting && this.hasSettingChanged(setting, originalSetting);
    });
  }

  static getChangedCount (current: SettingItem[], original: SettingItem[]): number {
    return current.filter(setting => {
      const originalSetting = original.find(orig => orig.id === setting.id);
      return originalSetting && this.hasSettingChanged(setting, originalSetting);
    }).length;
  }

  static getChangedSettings (current: SettingItem[], original: SettingItem[]): string[] {
    return current
      .filter(setting => {
        const originalSetting = original.find(orig => orig.id === setting.id);
        return originalSetting && this.hasSettingChanged(setting, originalSetting);
      })
      .map(setting => setting.label);
  }

  static filterAllowedSettings (settings: SettingItem[]): SettingItem[] {
    const allowedSettings = ['maintenance_mode', 'debug_logging', 'allow_registration', 'enforce_mfa'];
    return settings.filter(setting => allowedSettings.includes(setting.id));
  }

  static cloneSettings (settings: SettingItem[]): SettingItem[] {
    return JSON.parse(JSON.stringify(settings)) as SettingItem[];
  }

  private static hasSettingChanged (current: SettingItem, original: SettingItem): boolean {
    return original.value !== current.value || original.isActive !== current.isActive;
  }
}
