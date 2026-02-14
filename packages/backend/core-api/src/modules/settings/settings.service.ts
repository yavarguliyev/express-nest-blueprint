import { Injectable, ValidationService, BadRequestException, Cache, InvalidateCache, CACHE_TTL_1_MIN, CACHE_KEYS } from '@config/libs';

import { SettingsRepository } from '@modules/settings/settings.repository';
import { SystemSetting } from '@modules/settings/interfaces/settings.interface';
import { SettingsResponseDto } from '@modules/settings/dtos/settings-response.dto';
import { UpdateSettingsDto } from '@modules/settings/dtos/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor (private readonly settingsRepository: SettingsRepository) {}

  async getAllSettings (): Promise<SettingsResponseDto[]> {
    const settings = await this.getAllSettingsRaw();
    return this.transformToResponse(settings);
  }

  @Cache({ ttl: CACHE_TTL_1_MIN, key: CACHE_KEYS.SETTINGS.LIST_PREFIX })
  async getAllSettingsRaw (): Promise<SystemSetting[]> {
    return this.settingsRepository.findAll();
  }

  async getSettingByKey (key: string): Promise<SystemSetting | null> {
    const settings = await this.getAllSettingsRaw();
    return settings.find(s => s.key === key) || null;
  }

  async getSettingValue<T = boolean> (key: string, defaultValue?: T): Promise<T> {
    const setting = await this.getSettingByKey(key);

    if (!setting || !setting.isActive) {
      if (defaultValue !== undefined) return defaultValue;
      throw new BadRequestException(`Setting "${key}" not found or not active`);
    }

    return setting.value as T;
  }

  @InvalidateCache({ keys: [CACHE_KEYS.SETTINGS.LIST_PREFIX] })
  async updateSettings (updateDto: UpdateSettingsDto): Promise<SettingsResponseDto[]> {
    const updatedSettings: SystemSetting[] = [];

    for (const settingUpdate of updateDto.settings) {
      const updated = await this.settingsRepository.updateByKey(settingUpdate.key, settingUpdate.value);
      updatedSettings.push(updated);

      if (settingUpdate.isActive !== undefined) {
        const updatedActive = await this.settingsRepository.updateActiveStatus(settingUpdate.key, settingUpdate.isActive);
        updatedSettings[updatedSettings.length - 1] = updatedActive;
      }
    }

    return this.getAllSettings();
  }

  async isMaintenanceModeEnabled (): Promise<boolean> {
    return this.getSettingValue<boolean>('maintenance_mode', false);
  }

  async isDebugLoggingEnabled (): Promise<boolean> {
    return this.getSettingValue<boolean>('debug_logging', false);
  }

  async isRegistrationAllowed (): Promise<boolean> {
    return this.getSettingValue<boolean>('allow_registration', true);
  }

  async isMfaEnforced (): Promise<boolean> {
    return this.getSettingValue<boolean>('enforce_mfa', false);
  }

  private transformToResponse (settings: SystemSetting[]): SettingsResponseDto[] {
    return settings.map(setting => this.transformSingleToResponse(setting));
  }

  private transformSingleToResponse (setting: SystemSetting): SettingsResponseDto {
    const labelMap: Record<string, string> = {
      maintenance_mode: 'Maintenance Mode',
      debug_logging: 'Debug Logging',
      allow_registration: 'Allow Registration',
      enforce_mfa: 'Enforce MFA'
    };

    return ValidationService.transformResponse(SettingsResponseDto, {
      id: setting.key,
      label: labelMap[setting.key] || setting.key,
      description: setting.description || '',
      value: setting.value as boolean,
      isActive: setting.isActive,
      category: setting.category
    });
  }
}
