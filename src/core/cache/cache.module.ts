import { Module } from '@common/decorators';
import { DynamicModule } from '@common/interfaces';
import { CacheExplorer } from '@core/cache/cache.explorer';
import { CacheService } from '@core/cache/cache.service';

@Module({
  providers: [CacheService, CacheExplorer]
})
export class CacheModule {
  static forRoot (): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        CacheService,
        CacheExplorer,
        {
          provide: 'CACHE_INITIALIZER',
          useFactory: ((explorer: CacheExplorer) => (): void => explorer.explore()) as (...args: unknown[]) => unknown,
          inject: [CacheExplorer]
        }
      ],
      exports: [CacheService, 'CACHE_INITIALIZER']
    };
  }
}
