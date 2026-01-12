import 'reflect-metadata';

import { INJECT_METADATA } from '@common/decorators';
import type { Constructor, ProviderResolver, ProviderType } from '@common/types/common.type';

export const providerResolvers: Record<ProviderType, ProviderResolver> = {
  value: (entry) => {
    if (entry.type !== 'value') throw new Error('Invalid provider type');
    return entry.value;
  },
  factory: (entry, container) => {
    if (entry.type !== 'factory') throw new Error('Invalid provider type');
    const deps = entry.inject.map((dep) => container.resolve({ provide: dep }));
    return entry.factory(...deps);
  },
  class: (entry, container) => {
    if (entry.type !== 'class') throw new Error('Invalid provider type');
    const paramTypes = (Reflect.getMetadata('design:paramtypes', entry.target) || []) as Constructor[];
    const injectTokens = (Reflect.getMetadata(INJECT_METADATA, entry.target) || []) as Constructor[];

    const deps = paramTypes.map((dep, index) => {
      const customToken = injectTokens[index];

      if (customToken) return container.resolve({ provide: customToken });
      if (!dep || dep === Object || dep === String || dep === Number || dep === Boolean || dep === Array) return undefined;

      return container.resolve({ provide: dep });
    });

    return new (entry.target as unknown as new (...args: unknown[]) => unknown)(...deps);
  }
};
