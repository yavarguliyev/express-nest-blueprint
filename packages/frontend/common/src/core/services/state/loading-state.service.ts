import { Injectable, Signal, computed, signal } from '@angular/core';
import { LoadingState } from '../../../domain/types/state.type';

@Injectable({
  providedIn: 'root'
})
export class LoadingStateService {
  private _loading = signal<LoadingState>({});

  readonly loading: Signal<LoadingState> = this._loading.asReadonly();

  readonly isAnyLoading: Signal<boolean> = computed(() => {
    const state = this._loading();
    return Object.values(state).some(loading => loading);
  });

  isLoading (key: string): Signal<boolean> {
    return computed(() => this._loading()[key] || false);
  }

  setLoading (key: string, loading: boolean): void {
    this._loading.update(state => ({
      ...state,
      [key]: loading
    }));
  }

  startLoading (key: string): void {
    this.setLoading(key, true);
  }

  stopLoading (key: string): void {
    this.setLoading(key, false);
  }

  resetAll (): void {
    this._loading.set({});
  }

  getLoadingKeys (): Signal<string[]> {
    return computed(() => {
      const state = this._loading();
      return Object.keys(state).filter(key => state[key]);
    });
  }
}
