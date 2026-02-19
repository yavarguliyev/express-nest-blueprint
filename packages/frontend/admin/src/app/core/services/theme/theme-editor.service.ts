import { Injectable, inject, computed, effect } from '@angular/core';
import { Observable } from 'rxjs';

import { ThemeService } from './theme.service';
import { TokenService } from './token.service';
import { TokenDraftService } from './token-draft.service';
import { CssApplicationService } from './css-application.service';
import { TokenNotificationService } from './token-notification.service';
import { TokenRelationshipHandler } from './token-relationship-handler.service';
import { TokenDraftFactory } from './token-draft-factory.util';
import { SYNC_BOTH_MODES_TOKENS } from '../../constants/token.constants';
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
  private relationshipHandler = inject(TokenRelationshipHandler);

  tokens = this.tokenService.tokens;
  loading = this.tokenService.loading;
  draftCount = this.tokenDraftService.draftCount;
  hasDrafts = this.tokenDraftService.hasDrafts;

  constructor () {
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

  hasTokens = (): boolean => this.tokenService.hasTokens();
  loadTokens = (): Observable<CssToken[]> => this.tokenService.loadTokens();
  getDraft = (tokenId: string): TokenDraft | null => this.tokenDraftService.getDraft(tokenId);
  hasTokenChanges = (tokenId: string): boolean => this.tokenDraftService.hasTokenChanges(tokenId);
  getTokensByCategory = (category: string): CssToken[] => this.tokenService.getTokensByCategory(category);
  getCategories = (): string[] => this.tokenService.getCategories();

  setTokens (tokens: CssToken[]): void {
    this.tokenService.setTokens(tokens);
    this.applyCurrentTokens();
  }

  getTokenValue (tokenId: string, mode?: 'light' | 'dark'): string {
    const draft = this.tokenDraftService.getDraft(tokenId);
    const token = this.tokenService.getTokenById(tokenId);
    if (!token) return '';

    const currentMode = mode || this.themeService.currentTheme();
    const source = draft?.hasChanges ? draft : token;

    if (currentMode === 'light' && source.lightModeValue) return source.lightModeValue;
    if (currentMode === 'dark' && source.darkModeValue) return source.darkModeValue;
    return source.defaultValue;
  }

  updateTokenDraft (tokenId: string, value: string, mode: 'light' | 'dark' | 'default' = 'default'): void {
    const token = this.tokenService.getTokenById(tokenId);
    if (!token) return;

    const existingDraft = this.tokenDraftService.getDraft(tokenId);
    const shouldUpdateBothModes = SYNC_BOTH_MODES_TOKENS.some(prefix => token.tokenName.includes(prefix));

    let updatedDraft = TokenDraftFactory.createOrGetDraft(token, existingDraft);
    updatedDraft = TokenDraftFactory.updateDraftValue(updatedDraft, value, mode, shouldUpdateBothModes);
    updatedDraft = TokenDraftFactory.markChanges(updatedDraft, token);

    this.tokenDraftService.createOrUpdateDraft(updatedDraft);
    this.cssApplicationService.applyTokenToCSS(token.tokenName, value);

    this.relationshipHandler.updateRelatedTokens(token.tokenName, value, mode);
  }

  applyCurrentTokens (): void {
    if (typeof document === 'undefined') return;

    const tokens = this.tokenService.tokens();
    const currentMode = this.themeService.currentTheme();

    tokens.forEach(token => {
      const value = this.getTokenValue(token.id, currentMode);
      if (value) this.cssApplicationService.applyTokenToCSS(token.tokenName, value);
    });
  }

  publishDrafts (): Observable<boolean> {
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

  resetDrafts (): void {
    this.tokenDraftService.clearDrafts();
    this.applyCurrentTokens();
  }
}
