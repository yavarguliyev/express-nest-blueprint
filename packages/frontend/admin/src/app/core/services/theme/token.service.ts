import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { CssToken } from '../../interfaces/theme.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/common.interface';
import { API_ENDPOINTS } from '../../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private http = inject(HttpClient);
  private _tokens = signal<CssToken[]>([]);
  private _loading = signal(false);

  tokens = this._tokens.asReadonly();
  loading = this._loading.asReadonly();

  loadTokens (): Observable<CssToken[]> {
    if (this._tokens().length === 0) this._loading.set(true);

    const url = API_ENDPOINTS.ADMIN.CRUD('Database Management', 'css_tokens');

    return this.http.get<ApiResponse<PaginatedResponse<CssToken>>>(url, { params: { limit: '1000' } }).pipe(
      map(response => response.data.data),
      tap(tokens => {
        const sortedTokens = [...tokens].sort((a, b) => a.tokenName.localeCompare(b.tokenName));
        this._tokens.set(sortedTokens);
        this._loading.set(false);
      })
    );
  }

  getTokenById (tokenId: string): CssToken | undefined {
    return this._tokens().find(t => t.id === tokenId);
  }

  getTokenByName (tokenName: string): CssToken | undefined {
    return this._tokens().find(t => t.tokenName === tokenName);
  }

  getTokensByCategory (category: string): CssToken[] {
    return this._tokens().filter(token => token.tokenCategory === category);
  }

  getCategories (): string[] {
    const categories = new Set(this._tokens().map(token => token.tokenCategory));
    return Array.from(categories).sort();
  }

  updateToken (
    tokenId: string,
    updates: Partial<Pick<CssToken, 'lightModeValue' | 'darkModeValue' | 'defaultValue'>>
  ): Observable<ApiResponse<CssToken>> {
    const url = API_ENDPOINTS.ADMIN.CRUD_ID('Database Management', 'css_tokens', tokenId);
    return this.http.patch<ApiResponse<CssToken>>(url, updates);
  }

  hasToken (tokenName: string): boolean {
    return this._tokens().some(token => token.tokenName === tokenName);
  }

  setTokens (tokens: CssToken[]): void {
    this._tokens.set(tokens);
  }

  hasTokens (): boolean {
    return this._tokens().length > 0;
  }
}
