import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface TokenUpdateEvent {
  tokenIds?: string[];
  tokenNames?: string[];
  source: 'theme-editor' | 'database' | 'api';
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class TokenNotificationService {
  private tokenUpdateSubject = new Subject<TokenUpdateEvent>();

  tokenUpdated$ = this.tokenUpdateSubject.asObservable();

  notifyTokenUpdate(event: Omit<TokenUpdateEvent, 'timestamp'>): void {
    this.tokenUpdateSubject.next({
      ...event,
      timestamp: Date.now(),
    });
  }

  notifyTokensUpdated(tokenIds: string[], source: TokenUpdateEvent['source']): void {
    this.notifyTokenUpdate({
      tokenIds,
      source,
    });
  }

  notifyTokenNameUpdated(tokenNames: string[], source: TokenUpdateEvent['source']): void {
    this.notifyTokenUpdate({
      tokenNames,
      source,
    });
  }

  notifyAllTokensUpdated(source: TokenUpdateEvent['source']): void {
    this.notifyTokenUpdate({
      source,
    });
  }
}
