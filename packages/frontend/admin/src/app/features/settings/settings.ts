import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { DraftStatusBar } from '../../shared/components/draft-status-bar/draft-status-bar';
import { DraftStatusConfig } from '../../core/interfaces/theme.interface';
import { ToastService } from '../../core/services/ui/toast.service';
import { SettingsService } from '../../core/services/settings.service';
import { SettingItem, SettingsUpdateRequest } from '../../core/interfaces/common.interface';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitch, DraftStatusBar, DraggableResizableDirective],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly toastService = inject(ToastService);

  settings = signal<SettingItem[]>([]);
  originalSettings = signal<SettingItem[]>([]);
  loading = signal(false);

  hasChanges = computed(() => {
    const current = this.settings();
    const original = this.originalSettings();

    if (current.length !== original.length) return false;

    return current.some(setting => {
      const originalSetting = original.find(orig => orig.id === setting.id);
      return originalSetting && (originalSetting.value !== setting.value || originalSetting.isActive !== setting.isActive);
    });
  });

  changedCount = computed(() => {
    const current = this.settings();
    const original = this.originalSettings();

    return current.filter(setting => {
      const originalSetting = original.find(orig => orig.id === setting.id);
      return originalSetting && (originalSetting.value !== setting.value || originalSetting.isActive !== setting.isActive);
    }).length;
  });

  changedSettings = computed(() => {
    const current = this.settings();
    const original = this.originalSettings();

    return current
      .filter(setting => {
        const originalSetting = original.find(orig => orig.id === setting.id);
        return originalSetting && (originalSetting.value !== setting.value || originalSetting.isActive !== setting.isActive);
      })
      .map(setting => setting.label);
  });

  draftStatusConfig = computed<DraftStatusConfig>(() => ({
    draftCount: this.changedCount(),
    hasDrafts: this.hasChanges(),
    affectedItems: this.changedSettings(),
    isProcessing: this.loading(),
    itemType: 'item',
    resetButtonText: 'Reset Changes',
    saveButtonText: 'Save Changes',
    resetButtonIcon: 'refresh',
    saveButtonIcon: 'save'
  }));

  ngOnInit (): void {
    void this.loadSettings();
  }

  onToggleChange (settingId: string, newValue: boolean): void {
    this.settings.update(currentSettings => currentSettings.map(setting => (setting.id === settingId ? { ...setting, value: newValue } : setting)));
  }

  onActiveToggleChange (settingId: string, newValue: boolean): void {
    this.settings.update(currentSettings =>
      currentSettings.map(setting => (setting.id === settingId ? { ...setting, isActive: newValue } : setting))
    );
  }

  resetChanges (): void {
    if (!this.hasChanges()) {
      void this.toastService.info('No changes to reset');
      return;
    }

    void this.toastService.confirm(`Reset all ${this.changedCount()} unsaved changes? This cannot be undone.`, () => {
      this.settings.set(JSON.parse(JSON.stringify(this.originalSettings())) as SettingItem[]);
      void this.toastService.success('All changes have been reset');
    });
  }

  async refreshSettings (): Promise<void> {
    try {
      this.loading.set(true);
      const response = await firstValueFrom(this.settingsService.refreshSettings());

      const allowedSettings = ['maintenance_mode', 'debug_logging', 'allow_registration', 'enforce_mfa'];
      const filteredSettings = response.data.filter(setting => allowedSettings.includes(setting.id));

      this.settings.set(filteredSettings);
      this.originalSettings.set(JSON.parse(JSON.stringify(filteredSettings)) as SettingItem[]);
      void this.toastService.success('Settings refreshed successfully');
    } catch {
      void this.toastService.error('Failed to refresh settings');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSettings (): Promise<void> {
    try {
      this.loading.set(true);
      const response = await firstValueFrom(this.settingsService.loadSettings());

      const allowedSettings = ['maintenance_mode', 'debug_logging', 'allow_registration', 'enforce_mfa'];
      const filteredSettings = response.data.filter(setting => allowedSettings.includes(setting.id));

      this.settings.set(filteredSettings);
      this.originalSettings.set(JSON.parse(JSON.stringify(filteredSettings)) as SettingItem[]);
    } catch {
      void this.toastService.error('Failed to load settings');
    } finally {
      this.loading.set(false);
    }
  }

  async saveSettings (): Promise<void> {
    if (!this.hasChanges()) {
      void this.toastService.info('No changes to save');
      return;
    }

    try {
      this.loading.set(true);

      const updateRequest: SettingsUpdateRequest = {
        settings: this.settings().map(setting => ({
          key: this.mapIdToKey(setting.id),
          value: setting.value,
          isActive: setting.isActive
        }))
      };

      const response = await firstValueFrom(this.settingsService.updateSettings(updateRequest));

      this.settings.set(response.data);
      this.originalSettings.set(JSON.parse(JSON.stringify(response.data)) as SettingItem[]);

      void this.toastService.success(`Successfully updated settings`);
    } catch {
      void this.toastService.error('Failed to update settings');
    } finally {
      this.loading.set(false);
    }
  }

  private mapIdToKey (id: string): string {
    return id;
  }
}
