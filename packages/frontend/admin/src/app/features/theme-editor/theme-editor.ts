import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeEditorService, CssToken } from '../../core/services/theme-editor.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeSidebarService } from '../../core/services/theme-sidebar.service';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ColorPicker } from './components/color-picker/color-picker';
import { FontSelector } from './components/font-selector/font-selector';
import { SpacingSlider } from './components/spacing-slider/spacing-slider';
import { DraftStatusBar, DraftStatusConfig } from '../../shared/components/draft-status-bar/draft-status-bar';

@Component({
  selector: 'app-theme-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitch, ColorPicker, FontSelector, SpacingSlider, DraftStatusBar],
  templateUrl: './theme-editor.html',
  styleUrl: './theme-editor.css',
})
export class ThemeEditor implements OnInit {
  themeEditorService = inject(ThemeEditorService);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);
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

  // Computed config for the draft status bar
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

  currentCategoryTokens = computed(() => {
    const category = this.selectedCategory();
    return this.themeEditorService.getTokensByCategory(category);
  });

  ngOnInit () {
    this.loadTokens();
  }

  loadTokens (): void {
    this.themeEditorService.loadTokens().subscribe({
      next: () => {
        const categories = this.categories();
        if (categories.length > 0 && categories[0]) {
          this.selectedCategory.set(categories[0]);
        }
      },
      error: () => {
        this.toastService.error('Failed to load theme tokens');
      },
    });
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
    this.showPreview.update((current) => !current);
  }

  onTokenChange (
    tokenId: string,
    value: string,
    mode: 'light' | 'dark' | 'default' = 'default',
  ): void {
    this.themeEditorService.updateTokenDraft(tokenId, value, mode);
  }

  getTokenValue (tokenId: string, mode?: 'light' | 'dark'): string {
    return this.themeEditorService.getTokenValue(tokenId, mode);
  }

  hasTokenChanges (tokenId: string): boolean {
    return this.themeEditorService.hasTokenChanges(tokenId);
  }

  hasChangesInCategory (category: string): boolean {
    const tokens = this.themeEditorService.getTokensByCategory(category);
    return tokens.some((token) => this.hasTokenChanges(token.id));
  }

  getAffectedCategories (): string[] {
    const categories = this.categories();
    return categories.filter(category => this.hasChangesInCategory(category));
  }

  publishChanges (): void {
    if (!this.hasDrafts()) {
      this.toastService.info('No changes to publish');
      return;
    }

    this.isPublishing.set(true);

    this.themeEditorService.publishDrafts().subscribe({
      next: () => {
        this.isPublishing.set(false);
        this.toastService.success(`Successfully published ${this.draftCount()} theme changes`);
      },
      error: () => {
        this.isPublishing.set(false);
        this.toastService.error('Failed to publish theme changes');
      },
    });
  }

  resetChanges (): void {
    if (!this.hasDrafts()) {
      this.toastService.info('No changes to reset');
      return;
    }

    this.toastService.confirm(
      `Reset all ${this.draftCount()} unsaved changes? This cannot be undone.`,
      () => {
        this.themeEditorService.resetDrafts();
        this.toastService.success('All changes have been reset');
      },
    );
  }

  getCategoryDisplayName (category: string): string {
    const displayNames: Record<string, string> = {
      colors: 'Colors',
      spacing: 'Spacing',
      typography: 'Typography',
      borders: 'Borders',
      shadows: 'Shadows',
      gradients: 'Gradients',
    };
    return displayNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  getCategoryIcon (category: string): string {
    const icons: Record<string, string> = {
      colors: '🎨',
      spacing: '📏',
      typography: '🔤',
      borders: '⬜',
      shadows: '🌫️',
      gradients: '🌈',
    };
    return icons[category] || '⚙️';
  }

  isColorToken (token: CssToken): boolean {
    return token.tokenType === 'color' || token.tokenCategory === 'colors';
  }

  isFontToken (token: CssToken): boolean {
    return token.tokenType === 'font' || token.tokenCategory === 'typography';
  }

  isSpacingToken (token: CssToken): boolean {
    return token.tokenType === 'size' || token.tokenCategory === 'spacing';
  }

  getTokenInputType (token: CssToken): 'color' | 'font' | 'spacing' | 'text' {
    if (this.isColorToken(token)) return 'color';
    if (this.isFontToken(token)) return 'font';
    if (this.isSpacingToken(token)) return 'spacing';
    return 'text';
  }
}
