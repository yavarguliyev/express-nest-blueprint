import { BadRequestException } from '../../exceptions/http-exceptions';
import type { Constructor } from '../../types/common/util.type';
import type { ProviderResolver, ProviderType } from '../../types/module/provider.type';
import { INJECT_METADATA } from '../../../core/decorators/injectable.decorator';

export const providerResolvers: Record<ProviderType, ProviderResolver> = {
  value: entry => {
    if (entry.type !== 'value') throw new BadRequestException('Invalid provider type');
    return entry.value;
  },
  factory: (entry, container) => {
    if (entry.type !== 'factory') throw new BadRequestException('Invalid provider type');
    const deps = entry.inject.map(dep => container.resolve({ provide: dep }));
    return entry.factory(...deps);
  },
  class: (entry, container) => {
    if (entry.type !== 'class') throw new BadRequestException('Invalid provider type');
    const paramTypes = (Reflect.getMetadata('design:paramtypes', entry.target) || []) as Constructor[];
    const injectTokens = (Reflect.getMetadata(INJECT_METADATA, entry.target) || []) as Constructor[];

    const deps = paramTypes.map((dep, index) => {
      const customToken = injectTokens[index];

      if (customToken) return container.resolve({ provide: customToken });
      if (!dep || dep === Object || dep === String || dep === Number || dep === Boolean || dep === Array) return undefined;

      return container.resolve({ provide: dep });
    });

    const target = entry.target as new (...args: unknown[]) => unknown;
    return new target(...deps);
  }
};
