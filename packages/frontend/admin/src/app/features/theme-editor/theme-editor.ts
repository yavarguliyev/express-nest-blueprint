import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ThemeEditorService } from '../../core/services/theme/theme-editor.service';
import { CssToken } from '../../core/interfaces/theme.interface';
import { ThemeService } from '../../core/services/theme/theme.service';
import { ToastService } from '../../core/services/ui/toast.service';
import { ThemeSidebarService } from '../../core/services/theme/theme-sidebar.service';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ColorPicker } from './components/color-picker/color-picker';
import { FontSelector } from './components/font-selector/font-selector';
import { SpacingSlider } from './components/spacing-slider/spacing-slider';
import { DraftStatusBar } from '../../shared/components/draft-status-bar/draft-status-bar';
import { DraftStatusConfig } from '../../core/interfaces/theme.interface';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { CATEGORY_DISPLAY_NAMES, CATEGORY_ICONS } from '../../core/constants/token.constants';

@Component({
  selector: 'app-theme-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitch, ColorPicker, FontSelector, SpacingSlider, DraftStatusBar, DraggableResizableDirective],
  templateUrl: './theme-editor.html',
  styleUrl: './theme-editor.css'
})
export class ThemeEditor implements OnInit {
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  themeEditorService = inject(ThemeEditorService);
  themeSidebarService = inject(ThemeSidebarService);
  tokens = this.themeEditorService.tokens;
  loading = this.themeEditorService.loading;
  currentTheme = this.themeService.currentTheme;
  draftCount = this.themeEditorService.draftCount;
  hasDrafts = this.themeEditorService.hasDrafts;
  isSidebarCollapsed = this.themeSidebarService.isCollapsed;

  selectedCategory = signal<string>('colors');
  showPreview = signal(true);
  isPublishing = signal(false);
  categories = computed(() => this.themeEditorService.getCategories());
  draftStatusConfig = computed<DraftStatusConfig>(() => ({
    draftCount: this.draftCount(),
    hasDrafts: this.hasDrafts(),
    affectedItems: this.getAffectedCategories(),
    isProcessing: this.isPublishing(),
    itemType: 'token',
    resetButtonText: 'Reset',
    saveButtonText: 'Publish Changes',
    resetButtonIcon: 'refresh',
    saveButtonIcon: 'publish'
  }));
  currentCategoryTokens = computed(() => this.themeEditorService.getTokensByCategory(this.selectedCategory()));

  ngOnInit (): void {
    if (!this.themeEditorService.hasTokens()) this.loadTokens();
    else this.selectFirstCategory();
  }

  loadTokens (): void {
    this.themeEditorService.loadTokens().subscribe({
      next: () => this.selectFirstCategory(),
      error: () => this.toastService.error('Failed to load theme tokens')
    });
  }

  private selectFirstCategory (): void {
    const firstCategory = this.categories()[0];
    if (firstCategory) this.selectedCategory.set(firstCategory);
  }

  selectCategory (category: string): void {
    this.selectedCategory.set(category);
  }
  toggleThemeSidebar (): void {
    this.themeSidebarService.toggle();
  }
  isDarkMode (): boolean {
    return this.themeService.isDarkMode();
  }
  toggleTheme (): void {
    this.themeService.toggleTheme();
  }
  togglePreview (): void {
    this.showPreview.update(current => !current);
  }

  onTokenChange (tokenId: string, value: string, mode: 'light' | 'dark' | 'default' = 'default'): void {
    this.themeEditorService.updateTokenDraft(tokenId, value, mode);
  }

  getTokenValue (tokenId: string, mode?: 'light' | 'dark'): string {
    return this.themeEditorService.getTokenValue(tokenId, mode);
  }

  hasTokenChanges (tokenId: string): boolean {
    return this.themeEditorService.hasTokenChanges(tokenId);
  }

  hasChangesInCategory (category: string): boolean {
    return this.themeEditorService.getTokensByCategory(category).some(token => this.hasTokenChanges(token.id));
  }

  getAffectedCategories (): string[] {
    return this.categories().filter(category => this.hasChangesInCategory(category));
  }

  publishChanges (): void {
    if (!this.hasDrafts()) return this.toastService.info('No changes to publish');

    this.isPublishing.set(true);
    this.themeEditorService.publishDrafts().subscribe({
      next: () => {
        this.isPublishing.set(false);
        this.toastService.success(`Successfully published ${this.draftCount()} theme changes`);
      },
      error: () => {
        this.isPublishing.set(false);
        this.toastService.error('Failed to publish theme changes');
      }
    });
  }

  resetChanges (): void {
    if (!this.hasDrafts()) return this.toastService.info('No changes to reset');

    this.toastService.confirm(`Reset all ${this.draftCount()} unsaved changes? This cannot be undone.`, () => {
      this.themeEditorService.resetDrafts();
      this.toastService.success('All changes have been reset');
    });
  }

  getCategoryDisplayName (category: string): string {
    return CATEGORY_DISPLAY_NAMES[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  getCategoryIcon (category: string): string {
    return CATEGORY_ICONS[category] || '⚙️';
  }

  getTokenInputType (token: CssToken): 'color' | 'font' | 'spacing' | 'text' {
    if (token.tokenType === 'color' || token.tokenCategory === 'colors') return 'color';
    if (token.tokenType === 'font' || token.tokenCategory === 'typography') return 'font';
    if (token.tokenType === 'size' || token.tokenCategory === 'spacing') return 'spacing';
    return 'text';
  }
}
