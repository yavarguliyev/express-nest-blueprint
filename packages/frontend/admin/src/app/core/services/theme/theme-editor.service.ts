import { Injectable, inject, computed, effect } from '@angular/core';
import { Observable } from 'rxjs';

import { ThemeService } from './theme.service';
import { TokenService } from './token.service';
import { TokenDraftService } from './token-draft.service';
import { CssApplicationService } from './css-application.service';
import { TokenNotificationService } from './token-notification.service';
import { SYNC_BOTH_MODES_TOKENS, TOKEN_RELATIONSHIPS, TOKEN_GENERATORS } from '../../constants/token.constants';
import { CssToken, TokenDraft } from '../../interfaces/theme.interface';

@Injectable({
  providedIn: 'root'
})
export class ThemeEditorService {
  private themeService = inject(ThemeService);
  private tokenService = inject(TokenService);
  private tokenDraftService = inject(TokenDraftService);
  private cssApplicationService = inject(CssApplicationService);
  private tokenNotificationService = inject(TokenNotificationService);

  tokens = this.tokenService.tokens;
  loading = this.tokenService.loading;
  draftCount = this.tokenDraftService.draftCount;
  hasDrafts = this.tokenDraftService.hasDrafts;

  constructor() {
    effect(() => {
      this.themeService.currentTheme();
      this.applyCurrentTokens();
    });

    this.tokenNotificationService.tokenUpdated$.subscribe(event => {
      if (event.source !== 'theme-editor') this.loadTokens().subscribe();
    });
  }

  tokensByCategory = computed(() => {
    const tokens = this.tokenService.tokens();
    const grouped: Record<string, CssToken[]> = {};

    tokens.forEach(token => {
      if (!grouped[token.tokenCategory]) grouped[token.tokenCategory] = [];
      grouped[token.tokenCategory]!.push(token);
    });

    return grouped;
  });

  setTokens(tokens: CssToken[]): void {
    this.tokenService.setTokens(tokens);
    this.applyCurrentTokens();
  }

  hasTokens(): boolean {
    return this.tokenService.hasTokens();
  }

  loadTokens(): Observable<CssToken[]> {
    return this.tokenService.loadTokens();
  }

  getTokenValue(tokenId: string, mode?: 'light' | 'dark'): string {
    const draft = this.tokenDraftService.getDraft(tokenId);
    const token = this.tokenService.getTokenById(tokenId);
    if (!token) return '';

    const currentMode = mode || this.getCurrentThemeFromDocument();
    const source = draft?.hasChanges ? draft : token;

    if (currentMode === 'light' && source.lightModeValue) return source.lightModeValue;
    if (currentMode === 'dark' && source.darkModeValue) return source.darkModeValue;
    return source.defaultValue;
  }

  updateTokenDraft(tokenId: string, value: string, mode: 'light' | 'dark' | 'default' = 'default'): void {
    const token = this.tokenService.getTokenById(tokenId);
    if (!token) return;

    const existingDraft = this.tokenDraftService.getDraft(tokenId) || {
      id: tokenId,
      tokenName: token.tokenName,
      lightModeValue: token.lightModeValue,
      darkModeValue: token.darkModeValue,
      defaultValue: token.defaultValue,
      hasChanges: false
    };

    const updatedDraft = { ...existingDraft };

    const shouldUpdateBothModes = SYNC_BOTH_MODES_TOKENS.some(prefix => token.tokenName.includes(prefix));

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

    this.tokenDraftService.createOrUpdateDraft(updatedDraft);
    this.cssApplicationService.applyTokenToCSS(token.tokenName, value);

    this.updateRelatedTokens(token.tokenName, value, mode);
  }

  applyCurrentTokens(): void {
    if (typeof document === 'undefined') return;

    const tokens = this.tokenService.tokens();
    const currentMode = this.getCurrentThemeFromDocument();

    tokens.forEach(token => {
      const value = this.getTokenValue(token.id, currentMode);
      if (value) this.cssApplicationService.applyTokenToCSS(token.tokenName, value);
    });
  }

  publishDrafts(): Observable<boolean> {
    const drafts = this.tokenDraftService.getAllDraftsForPublish();

    if (drafts.length === 0) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    const updateRequests = drafts.map(draft =>
      this.tokenService
        .updateToken(draft.id, {
          lightModeValue: draft.lightModeValue,
          darkModeValue: draft.darkModeValue,
          defaultValue: draft.defaultValue
        })
        .toPromise()
    );

    return new Observable(observer => {
      Promise.all(updateRequests)
        .then(() => {
          this.tokenService.loadTokens().subscribe(() => {
            this.tokenDraftService.clearDrafts();
            this.tokenNotificationService.notifyTokensUpdated(
              drafts.map(d => d.id),
              'theme-editor'
            );
            observer.next(true);
            observer.complete();
          });
        })
        .catch(error => observer.error(error));
    });
  }

  resetDrafts(): void {
    this.tokenDraftService.clearDrafts();
    this.applyCurrentTokens();
  }

  getDraft(tokenId: string): TokenDraft | null {
    return this.tokenDraftService.getDraft(tokenId);
  }

  hasTokenChanges(tokenId: string): boolean {
    return this.tokenDraftService.hasTokenChanges(tokenId);
  }

  getTokensByCategory(category: string): CssToken[] {
    return this.tokenService.getTokensByCategory(category);
  }

  getCategories(): string[] {
    return this.tokenService.getCategories();
  }

  refreshTokens(): Observable<CssToken[]> {
    return this.tokenService.loadTokens();
  }

  hasToken(tokenName: string): boolean {
    return this.tokenService.hasToken(tokenName);
  }

  private getCurrentThemeFromDocument(): 'light' | 'dark' {
    return this.themeService.currentTheme();
  }

  private updateRelatedTokens(tokenName: string, value: string, mode: 'light' | 'dark' | 'default'): void {
    const relatedTokenNames = TOKEN_RELATIONSHIPS[tokenName];
    if (!relatedTokenNames) return;

    relatedTokenNames.forEach(relatedTokenName => {
      const generator = TOKEN_GENERATORS[relatedTokenName];
      if (!generator) return;

      const generatedValue = generator(value);
      const relatedToken = this.tokenService.getTokenByName(relatedTokenName);
      if (!relatedToken) return;

      const existingDraft = this.tokenDraftService.getDraft(relatedToken.id) || {
        id: relatedToken.id,
        tokenName: relatedToken.tokenName,
        lightModeValue: relatedToken.lightModeValue,
        darkModeValue: relatedToken.darkModeValue,
        defaultValue: relatedToken.defaultValue,
        hasChanges: false
      };

      const updatedDraft = { ...existingDraft };

      if (mode === 'light') {
        updatedDraft.lightModeValue = generatedValue;
      } else if (mode === 'dark') {
        updatedDraft.darkModeValue = generatedValue;
      } else {
        updatedDraft.defaultValue = generatedValue;
        updatedDraft.lightModeValue = generatedValue;
        updatedDraft.darkModeValue = generatedValue;
      }

      updatedDraft.hasChanges =
        updatedDraft.lightModeValue !== relatedToken.lightModeValue ||
        updatedDraft.darkModeValue !== relatedToken.darkModeValue ||
        updatedDraft.defaultValue !== relatedToken.defaultValue;

      this.tokenDraftService.createOrUpdateDraft(updatedDraft);
      this.cssApplicationService.applyTokenToCSS(relatedTokenName, generatedValue);
    });
  }
}
