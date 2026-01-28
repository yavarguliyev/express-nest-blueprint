import { Injectable, ValidationService, BadRequestException } from '@config/libs';

import { SettingsRepository } from '@modules/settings/settings.repository';
import { SystemSetting } from '@modules/settings/interfaces/settings.interface';
import { SettingsResponseDto } from '@modules/settings/dtos/settings-response.dto';
import { UpdateSettingsDto } from '@modules/settings/dtos/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor (private readonly settingsRepository: SettingsRepository) {}

  async getAllSettings (): Promise<SettingsResponseDto[]> {
    const settings = await this.settingsRepository.findAll();
    return this.transformToResponse(settings);
  }

  async getSettingByKey (key: string): Promise<SystemSetting | null> {
    return this.settingsRepository.findByKey(key);
  }

  async getSettingValue<T = boolean> (key: string, defaultValue?: T): Promise<T> {
    const setting = await this.getSettingByKey(key);

    if (!setting || !setting.isActive) {
      if (defaultValue !== undefined) return defaultValue;
      throw new BadRequestException(`Setting "${key}" not found or not active`);
    }

    return setting.value as T;
  }

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

    const allSettings = await this.settingsRepository.findAll();
    const responseSettings = this.transformToResponse(allSettings);

    return responseSettings;
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
