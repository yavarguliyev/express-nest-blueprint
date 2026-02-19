import { Injectable, inject } from '@angular/core';

import { TokenService } from './token.service';
import { TokenDraftService } from './token-draft.service';
import { CssApplicationService } from './css-application.service';
import { TokenDraftFactory } from './token-draft-factory.util';
import { TOKEN_RELATIONSHIPS, TOKEN_GENERATORS } from '../../constants/token.constants';

@Injectable({
  providedIn: 'root'
})
export class TokenRelationshipHandler {
  private tokenService = inject(TokenService);
  private tokenDraftService = inject(TokenDraftService);
  private cssApplicationService = inject(CssApplicationService);

  updateRelatedTokens (tokenName: string, value: string, mode: 'light' | 'dark' | 'default'): void {
    const relatedTokenNames = TOKEN_RELATIONSHIPS[tokenName];
    if (!relatedTokenNames) return;

    relatedTokenNames.forEach(relatedTokenName => {
      this.updateSingleRelatedToken(relatedTokenName, value, mode);
    });
  }

  private updateSingleRelatedToken (relatedTokenName: string, sourceValue: string, mode: 'light' | 'dark' | 'default'): void {
    const generator = TOKEN_GENERATORS[relatedTokenName];
    if (!generator) return;

    const generatedValue = generator(sourceValue);
    const relatedToken = this.tokenService.getTokenByName(relatedTokenName);
    if (!relatedToken) return;

    const existingDraft = this.tokenDraftService.getDraft(relatedToken.id);
    let updatedDraft = TokenDraftFactory.createOrGetDraft(relatedToken, existingDraft);
    updatedDraft = TokenDraftFactory.updateDraftValue(updatedDraft, generatedValue, mode);
    updatedDraft = TokenDraftFactory.markChanges(updatedDraft, relatedToken);

    this.tokenDraftService.createOrUpdateDraft(updatedDraft);
    this.cssApplicationService.applyTokenToCSS(relatedTokenName, generatedValue);
  }
}
