import { Injectable } from '@angular/core';

import { StorageOptions } from '../../../domain/types/state.type';
import { StorageData } from '../../../domain/interfaces/storage-data.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  set<T> (key: string, value: T, options?: StorageOptions): void {
    try {
      const data: StorageData<T> = {
        value,
        version: options?.version || '1.0.0',
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      return;
    }
  }

  get<T> (key: string, options?: StorageOptions): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const data = JSON.parse(item) as StorageData<T>;

      if (options?.version && data.version !== options.version) {
        if (options.migrate) {
          const migrated = options.migrate(data.value, data.version) as T;
          this.set(key, migrated, options);
          return migrated;
        }

        this.remove(key);
        return null;
      }

      return data.value;
    } catch {
      this.remove(key);
      return null;
    }
  }

  remove (key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  }

  clear (): void {
    try {
      localStorage.clear();
    } catch {
      return;
    }
  }

  has (key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  keys (): string[] {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }

    return keys;
  }
}
