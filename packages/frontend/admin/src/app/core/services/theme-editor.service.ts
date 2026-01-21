import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { ThemeService } from './theme.service';

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
  }

  loadTokens (): Observable<CssToken[]> {
    this._loading.set(true);

    return this.http
      .get<
        ApiResponse<PaginatedResponse<CssToken>>
      >('/api/v1/admin/crud/Database Management/css_tokens', { params: { limit: '1000' } })
      .pipe(
        map((response) => response.data.data),
        tap((tokens) => {
          this._tokens.set(tokens);
          this._loading.set(false);
          this.applyCurrentTokens();
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
    if (mode === 'light') {
      updatedDraft.lightModeValue = value;
    } else if (mode === 'dark') {
      updatedDraft.darkModeValue = value;
    } else {
      updatedDraft.defaultValue = value;
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
    }
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
  }

  private getCurrentThemeFromDocument (): 'light' | 'dark' {
    return this.themeService.currentTheme();
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
        `/api/v1/admin/crud/Database Management/css_tokens/${draft.id}`,
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
          this.loadTokens().subscribe(() => {
            this._loading.set(false);
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
}
