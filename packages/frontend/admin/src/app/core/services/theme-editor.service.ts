import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of } from 'rxjs';
import { ThemeService } from './theme.service';
import { GlobalCacheService } from './global-cache.service';
import { TokenNotificationService } from './token-notification.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface CssToken {
  id: string;
  tokenName: string;
  tokenCategory: string;
  tokenType: string;
  defaultValue: string;
  lightModeValue: string | null;
  darkModeValue: string | null;
  description: string | null;
  isCustomizable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenDraft {
  id: string;
  tokenName: string;
  lightModeValue: string | null;
  darkModeValue: string | null;
  defaultValue: string;
  hasChanges: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeEditorService {
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);
  private cacheService = inject(GlobalCacheService);
  private tokenNotificationService = inject(TokenNotificationService);
  private readonly DRAFT_STORAGE_KEY = 'theme-editor-drafts';

  private _tokens = signal<CssToken[]>([]);
  private _drafts = signal<Map<string, TokenDraft>>(new Map());
  private _loading = signal(false);

  tokens = this._tokens.asReadonly();
  loading = this._loading.asReadonly();

  tokensByCategory = computed(() => {
    const tokens = this._tokens();
    const grouped: Record<string, CssToken[]> = {};

    tokens.forEach((token) => {
      if (!grouped[token.tokenCategory]) {
        grouped[token.tokenCategory] = [];
      }
      grouped[token.tokenCategory]!.push(token);
    });

    return grouped;
  });

  draftCount = computed(() => {
    const drafts = this._drafts();
    return Array.from(drafts.values()).filter((draft) => draft.hasChanges).length;
  });

  hasDrafts = computed(() => this.draftCount() > 0);

  constructor () {
    this.loadDraftsFromStorage();

    effect(() => {
      this.themeService.currentTheme();
      this.applyCurrentTokens();
    });

    this.tokenNotificationService.tokenUpdated$.subscribe((event) => {
      if (event.source !== 'theme-editor') {
        this.cacheService.delete('css-tokens');
        this.loadTokens().subscribe();
      }
    });
  }

  setTokens (tokens: CssToken[]): void {
    this._tokens.set(tokens);
    this.applyCurrentTokens();
  }

  hasTokens (): boolean {
    return this._tokens().length > 0 || this.cacheService.has('css-tokens');
  }

  loadTokens (): Observable<CssToken[]> {
    const cachedTokens = this.cacheService.get<CssToken[]>('css-tokens');
    if (cachedTokens) {
      this._tokens.set(cachedTokens);
      this.applyCurrentTokens();
      return of(cachedTokens);
    }

    this._loading.set(true);

    const url = API_ENDPOINTS.ADMIN.CRUD('Database Management', 'css_tokens');

    return this.http
      .get<ApiResponse<PaginatedResponse<CssToken>>>(url, { params: { limit: '1000' } })
      .pipe(
        map((response) => {
          return response.data.data;
        }),
        tap((tokens) => {
          this._tokens.set(tokens);
          this._loading.set(false);
          this.applyCurrentTokens();

          this.cacheService.set('css-tokens', tokens, 10 * 60 * 1000);
        }),
      );
  }

  getTokenValue (tokenId: string, mode?: 'light' | 'dark'): string {
    const draft = this._drafts().get(tokenId);
    const token = this._tokens().find((t) => t.id === tokenId);

    if (!token) return '';

    const currentMode = mode || this.getCurrentThemeFromDocument();

    if (draft && draft.hasChanges) {
      if (currentMode === 'light' && draft.lightModeValue) return draft.lightModeValue;
      if (currentMode === 'dark' && draft.darkModeValue) return draft.darkModeValue;
      return draft.defaultValue;
    }

    if (currentMode === 'light' && token.lightModeValue) return token.lightModeValue;
    if (currentMode === 'dark' && token.darkModeValue) return token.darkModeValue;
    return token.defaultValue;
  }

  updateTokenDraft (
    tokenId: string,
    value: string,
    mode: 'light' | 'dark' | 'default' = 'default',
  ): void {
    const token = this._tokens().find((t) => t.id === tokenId);
    if (!token) return;

    const currentDrafts = this._drafts();
    const existingDraft = currentDrafts.get(tokenId) || {
      id: tokenId,
      tokenName: token.tokenName,
      lightModeValue: token.lightModeValue,
      darkModeValue: token.darkModeValue,
      defaultValue: token.defaultValue,
      hasChanges: false,
    };

    const updatedDraft = { ...existingDraft };

    const isToggleToken = token.tokenName.includes('toggle');
    const isButtonToken = token.tokenName.includes('btn-');
    const shouldUpdateBothModes = isToggleToken || isButtonToken;

    if (mode === 'light') {
      updatedDraft.lightModeValue = value;
      if (shouldUpdateBothModes) updatedDraft.darkModeValue = value;
    } else if (mode === 'dark') {
      updatedDraft.darkModeValue = value;
      if (shouldUpdateBothModes) updatedDraft.lightModeValue = value;
    } else {
      updatedDraft.defaultValue = value;
      updatedDraft.lightModeValue = value;
      updatedDraft.darkModeValue = value;
    }

    updatedDraft.hasChanges =
      updatedDraft.lightModeValue !== token.lightModeValue ||
      updatedDraft.darkModeValue !== token.darkModeValue ||
      updatedDraft.defaultValue !== token.defaultValue;

    const newDrafts = new Map(currentDrafts);
    if (updatedDraft.hasChanges) {
      newDrafts.set(tokenId, updatedDraft);
    } else {
      newDrafts.delete(tokenId);
    }

    this._drafts.set(newDrafts);
    this.saveDraftsToStorage();
    this.applyTokenToCSS(token.tokenName, value);
  }

  private applyTokenToCSS (tokenName: string, value: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(tokenName, value);

      this.applyRelatedTokens(tokenName, value);
    }
  }

  private applyRelatedTokens (tokenName: string, value: string): void {
    const tokenRelationships: Record<string, string[]> = {
      '--btn-primary-start': ['--btn-primary-hover-start'],
      '--btn-primary-end': ['--btn-primary-hover-end'],
      '--btn-secondary-bg': ['--btn-secondary-hover'],
    };

    const relatedTokenNames = tokenRelationships[tokenName];
    if (!relatedTokenNames) return;

    const tokens = this._tokens();

    relatedTokenNames.forEach((relatedTokenName) => {
      const relatedToken = tokens.find((t) => t.tokenName === relatedTokenName);

      if (relatedToken) {
        const relatedValue = this.getTokenValue(relatedToken.id);
        if (relatedValue) {
          document.documentElement.style.setProperty(relatedTokenName, relatedValue);
        }
      } else {
        const generatedValue = this.generateRelatedTokenValue(tokenName, relatedTokenName, value);
        if (generatedValue) {
          document.documentElement.style.setProperty(relatedTokenName, generatedValue);
        }
      }
    });
  }

  private generateRelatedTokenValue (
    _baseTokenName: string,
    relatedTokenName: string,
    baseValue: string,
  ): string | null {
    const generationRules: Record<string, (value: string) => string> = {
      '--btn-primary-hover-start': (value) => this.adjustColor(value, 15),
      '--btn-primary-hover-end': (value) => this.adjustColor(value, 15),
      '--btn-secondary-hover': (value) => this.adjustOpacity(value, 0.15),
    };

    const generator = generationRules[relatedTokenName];
    return generator ? generator(baseValue) : null;
  }

  private adjustOpacity (color: string, newOpacity: number): string {
    if (color.startsWith('rgba(')) {
      return color.replace(/,\s*[\d.]+\)$/, `, ${newOpacity})`);
    }
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${newOpacity})`);
    }
    return color;
  }

  applyCurrentTokens (): void {
    if (typeof document === 'undefined') return;

    const tokens = this._tokens();
    const currentMode = this.getCurrentThemeFromDocument();

    tokens.forEach((token) => {
      const value = this.getTokenValue(token.id, currentMode);
      if (value) {
        document.documentElement.style.setProperty(token.tokenName, value);
      }
    });

    tokens.forEach((token) => {
      const value = this.getTokenValue(token.id, currentMode);
      if (value) {
        this.applyRelatedTokens(token.tokenName, value);
      }
    });
  }

  private getCurrentThemeFromDocument (): 'light' | 'dark' {
    return this.themeService.currentTheme();
  }

  private adjustColor (color: string, percent: number): string {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent) / 100));
      const g = Math.min(
        255,
        Math.floor(((num >> 8) & 0x00ff) + ((255 - ((num >> 8) & 0x00ff)) * percent) / 100),
      );
      const b = Math.min(
        255,
        Math.floor((num & 0x0000ff) + ((255 - (num & 0x0000ff)) * percent) / 100),
      );
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = Math.min(
          255,
          parseInt(matches[0]) + Math.floor(((255 - parseInt(matches[0])) * percent) / 100),
        );
        const g = Math.min(
          255,
          parseInt(matches[1]!) + Math.floor(((255 - parseInt(matches[1]!)) * percent) / 100),
        );
        const b = Math.min(
          255,
          parseInt(matches[2]!) + Math.floor(((255 - parseInt(matches[2]!)) * percent) / 100),
        );
        const a = matches[3] ? parseFloat(matches[3]) : 1;
        return matches.length > 3 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
      }
    }

    return color;
  }

  publishDrafts (): Observable<boolean> {
    const drafts = Array.from(this._drafts().values()).filter((draft) => draft.hasChanges);

    if (drafts.length === 0) {
      return new Observable((observer) => {
        observer.next(true);
        observer.complete();
      });
    }

    this._loading.set(true);

    const updateRequests = drafts.map((draft) =>
      this.http.patch<ApiResponse<CssToken>>(
        API_ENDPOINTS.ADMIN.CRUD_ID('Database Management', 'css_tokens', draft.id),
        {
          lightModeValue: draft.lightModeValue,
          darkModeValue: draft.darkModeValue,
          defaultValue: draft.defaultValue,
        },
      ),
    );

    return new Observable((observer) => {
      Promise.all(updateRequests.map((req) => req.toPromise()))
        .then(() => {
          this.clearDrafts();
          this.cacheService.delete('css-tokens');
          this.loadTokens().subscribe(() => {
            this._loading.set(false);

            // Notify other services that tokens have been updated
            const updatedTokenIds = drafts.map((draft) => draft.id);
            this.tokenNotificationService.notifyTokensUpdated(updatedTokenIds, 'theme-editor');

            observer.next(true);
            observer.complete();
          });
        })
        .catch((error) => {
          this._loading.set(false);
          observer.error(error);
        });
    });
  }

  resetDrafts (): void {
    this._drafts.set(new Map());
    this.saveDraftsToStorage();
    this.applyCurrentTokens();
  }

  private clearDrafts (): void {
    this._drafts.set(new Map());
    this.saveDraftsToStorage();
  }

  getDraft (tokenId: string): TokenDraft | null {
    return this._drafts().get(tokenId) || null;
  }

  hasTokenChanges (tokenId: string): boolean {
    const draft = this._drafts().get(tokenId);
    return draft ? draft.hasChanges : false;
  }

  private saveDraftsToStorage (): void {
    if (typeof window !== 'undefined') {
      const draftsArray = Array.from(this._drafts().entries());
      localStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(draftsArray));
    }
  }

  private loadDraftsFromStorage (): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.DRAFT_STORAGE_KEY);

      const stored = localStorage.getItem(this.DRAFT_STORAGE_KEY);
      if (stored) {
        const draftsArray = JSON.parse(stored) as [string, TokenDraft][];
        this._drafts.set(new Map(draftsArray));
      }
    }
  }

  getTokensByCategory (category: string): CssToken[] {
    return this._tokens().filter((token) => token.tokenCategory === category);
  }

  getCategories (): string[] {
    const tokens = this._tokens();
    const categories = new Set(tokens.map((token) => token.tokenCategory));
    return Array.from(categories).sort();
  }

  refreshTokens (): Observable<CssToken[]> {
    this.cacheService.delete('css-tokens');
    return this.loadTokens();
  }

  hasToken (tokenName: string): boolean {
    return this._tokens().some((token) => token.tokenName === tokenName);
  }
}
