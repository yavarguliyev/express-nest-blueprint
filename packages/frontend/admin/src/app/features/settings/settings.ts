import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { DraftStatusBar } from '../../shared/components/draft-status-bar/draft-status-bar';
import { DraftStatusConfig } from '../../core/interfaces/theme.interface';
import { ToastService } from '../../core/services/ui/toast.service';
import { SettingsService } from '../../core/services/utilities/settings.service';
import { SettingItem, SettingsUpdateRequest } from '../../core/interfaces/common.interface';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { SettingsChangeDetector } from './settings-change-detector.util';

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

  hasChanges = computed(() => SettingsChangeDetector.hasChanges(this.settings(), this.originalSettings()));
  changedCount = computed(() => SettingsChangeDetector.getChangedCount(this.settings(), this.originalSettings()));
  changedSettings = computed(() => SettingsChangeDetector.getChangedSettings(this.settings(), this.originalSettings()));
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
      this.settings.set(SettingsChangeDetector.cloneSettings(this.originalSettings()));
      void this.toastService.success('All changes have been reset');
    });
  }

  async refreshSettings (): Promise<void> {
    try {
      this.loading.set(true);
      const response = await firstValueFrom(this.settingsService.refreshSettings());
      const filteredSettings = SettingsChangeDetector.filterAllowedSettings(response.data);
      this.settings.set(filteredSettings);
      this.originalSettings.set(SettingsChangeDetector.cloneSettings(filteredSettings));
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
      const filteredSettings = SettingsChangeDetector.filterAllowedSettings(response.data);
      this.settings.set(filteredSettings);
      this.originalSettings.set(SettingsChangeDetector.cloneSettings(filteredSettings));
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
          key: setting.id,
          value: setting.value,
          isActive: setting.isActive
        }))
      };
      const response = await firstValueFrom(this.settingsService.updateSettings(updateRequest));
      this.settings.set(response.data);
      this.originalSettings.set(SettingsChangeDetector.cloneSettings(response.data));
      void this.toastService.success(`Successfully updated settings`);
    } catch {
      void this.toastService.error('Failed to update settings');
    } finally {
      this.loading.set(false);
    }
  }
}
