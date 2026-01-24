import { Injectable } from '@angular/core';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalCacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  get<T> (key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  set<T> (key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  has (key: string): boolean {
    return this.get(key) !== null;
  }

  delete (key: string): void {
    this.cache.delete(key);
  }

  clear (): void {
    this.cache.clear();
  }

  getCacheInfo (): { key: string; age: number; ttl: number }[] {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      age: now - item.timestamp,
      ttl: item.ttl,
    }));
  }

  cleanup (): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp >= item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
