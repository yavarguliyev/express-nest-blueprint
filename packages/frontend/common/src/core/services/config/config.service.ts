import { Injectable, signal, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private _config = signal<Record<string, unknown>>({});
  private _defaults = signal<Record<string, unknown>>({});

  get<T> (key: string): T | undefined {
    const config = this._config();
    const defaults = this._defaults();

    if (key in config) {
      return config[key] as T;
    }

    if (key in defaults) {
      return defaults[key] as T;
    }

    return undefined;
  }

  getOrDefault<T> (key: string, fallback: T): T {
    const value = this.get<T>(key);
    return value !== undefined ? value : fallback;
  }

  set (key: string, value: unknown): void {
    this._config.update(config => ({
      ...config,
      [key]: value
    }));
  }

  setMany (config: Record<string, unknown>): void {
    this._config.update(current => ({
      ...current,
      ...config
    }));
  }

  setDefaults (defaults: Record<string, unknown>): void {
    this._defaults.set(defaults);
  }

  has (key: string): boolean {
    const config = this._config();
    const defaults = this._defaults();
    return key in config || key in defaults;
  }

  remove (key: string): void {
    this._config.update(config => {
      const newConfig = { ...config };
      delete newConfig[key];
      return newConfig;
    });
  }

  clear (): void {
    this._config.set({});
  }

  keys (): string[] {
    const config = this._config();
    const defaults = this._defaults();
    return [...new Set([...Object.keys(config), ...Object.keys(defaults)])];
  }

  watch<T> (key: string): Signal<T | undefined> {
    return signal(this.get<T>(key));
  }

  validate (schema: Record<string, (value: unknown) => boolean>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this._config();

    Object.entries(schema).forEach(([key, validator]) => {
      const value = config[key];
      if (!validator(value)) {
        errors.push(`Invalid configuration for key: ${key}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
