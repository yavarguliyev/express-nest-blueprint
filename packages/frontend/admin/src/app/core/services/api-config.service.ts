import { Injectable, signal } from '@angular/core';

import { ApiProtocol } from '../types/api.type';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  private _protocol = signal<ApiProtocol>('rest');

  protocol = this._protocol.asReadonly();

  setProtocol (protocol: ApiProtocol): void {
    this._protocol.set(protocol);
  }

  isGraphQL (): boolean {
    return this._protocol() === 'graphql';
  }

  isREST (): boolean {
    return this._protocol() === 'rest';
  }
}
