import { Container } from '../container/container';
import { CACHE_METADATA } from '../decorators/cache.decorator';
import { Injectable } from '../decorators/injectable.decorator';
import { CacheOptions } from '../interfaces/common.interface';
import { CacheService } from '../cache/cache.service';

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

        const metadata = Reflect.getMetadata(CACHE_METADATA, method) as (CacheOptions & { methodName: string }) | undefined;

        if (metadata) this.patchMethod(instance, methodName, metadata);
      }
    }
  }

  private patchMethod (instance: Record<string, unknown>, methodName: string, options: CacheOptions): void {
    const originalMethod = instance[methodName] as (...args: unknown[]) => Promise<unknown>;
    const cacheService = this.cacheService;

    instance[methodName] = async function (...args: unknown[]): Promise<unknown> {
      const cacheKey = options.key ?? `${instance.constructor.name}:${methodName}:${JSON.stringify(args)}`;
      const cachedResult = await cacheService.get(cacheKey);

      if (cachedResult !== null) return cachedResult;

      const result = await originalMethod.apply(this, args);
      await cacheService.set(cacheKey, result, options.ttl);
      return result;
    };
  }
}
