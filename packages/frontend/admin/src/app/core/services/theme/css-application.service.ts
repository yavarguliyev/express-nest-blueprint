import { Injectable } from '@angular/core';

import { TOKEN_RELATIONSHIPS, TOKEN_GENERATORS } from '../../constants/token.constants';

@Injectable({
  providedIn: 'root'
})
export class CssApplicationService {
  applyTokenToCSS (tokenName: string, value: string): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(tokenName, value);
    this.applyRelatedTokens(tokenName, value);
  }

  applyAllTokens (tokens: Map<string, string>): void {
    if (typeof document === 'undefined') return;
    tokens.forEach((value, tokenName) => document.documentElement.style.setProperty(tokenName, value));
    tokens.forEach((value, tokenName) => this.applyRelatedTokens(tokenName, value));
  }

  removeToken (tokenName: string): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.removeProperty(tokenName);
  }

  private applyRelatedTokens (tokenName: string, value: string): void {
    const relatedTokenNames = TOKEN_RELATIONSHIPS[tokenName];
    if (!relatedTokenNames) return;

    relatedTokenNames.forEach(relatedTokenName => {
      const generator = TOKEN_GENERATORS[relatedTokenName];
      if (generator) {
        const generatedValue = generator(value);
        document.documentElement.style.setProperty(relatedTokenName, generatedValue);
      }
    });
  }
}
