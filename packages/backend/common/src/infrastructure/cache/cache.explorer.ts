import { CacheService } from '../cache/cache.service';
import { Container } from '../../core/container/container';
import { CACHE_METADATA, INVALIDATE_CACHE_METADATA } from '../../core/decorators/cache.decorator';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { CacheOptions, InvalidateCacheOptions } from '../../domain/interfaces/infra/infra-common.interface';

@Injectable()
export class CacheExplorer {
  constructor (private readonly cacheService: CacheService) {}

  explore (): void {
    const services = Container.getInstance().getServices();
    for (const [token, entry] of services) {
      if (entry.type !== 'class') continue;

      const instance = Container.getInstance().resolve({ provide: token }) as Record<string, unknown>;
      const proto = Object.getPrototypeOf(instance) as unknown;
      if (!proto) continue;

      const methods = Object.getOwnPropertyNames(proto);
      for (const methodName of methods) {
        if (methodName === 'constructor') continue;

        const method = (proto as Record<string, unknown>)[methodName];
        if (typeof method !== 'function') continue;

        const cacheMetadata = Reflect.getMetadata(CACHE_METADATA, method) as (CacheOptions & { methodName: string }) | undefined;
        if (cacheMetadata) this.patchCacheMethod(instance, methodName, cacheMetadata);

        const invalidateMetadata = Reflect.getMetadata(INVALIDATE_CACHE_METADATA, method) as (InvalidateCacheOptions & { methodName: string }) | undefined;
        if (invalidateMetadata) this.patchInvalidationMethod(instance, methodName, invalidateMetadata);
      }
    }
  }

  private patchCacheMethod (instance: Record<string, unknown>, methodName: string, options: CacheOptions): void {
    const originalMethod = instance[methodName] as (...args: unknown[]) => Promise<unknown>;
    const cacheService = this.cacheService;

    instance[methodName] = async function (...args: unknown[]): Promise<unknown> {
      const cacheKey = typeof options.key === 'function' ? options.key(...args) : options.key ?? `${instance.constructor.name}:${methodName}:${JSON.stringify(args)}`;
      const cachedResult = await cacheService.get(cacheKey);

      if (cachedResult !== null) return cachedResult;

      const result = await originalMethod.apply(this, args);
      await cacheService.set(cacheKey, result, options.ttl);
      return result;
    };
  }

  private patchInvalidationMethod (instance: Record<string, unknown>, methodName: string, options: InvalidateCacheOptions): void {
    const originalMethod = instance[methodName] as (...args: unknown[]) => Promise<unknown>;
    const cacheService = this.cacheService;

    instance[methodName] = async function (...args: unknown[]): Promise<unknown> {
      const result = await originalMethod.apply(this, args);

      for (const keyOrFn of options.keys) {
        const key = typeof keyOrFn === 'function' ? keyOrFn(...args) : keyOrFn;
        await cacheService.delete(key);
      }

      return result;
    };
  }
}
