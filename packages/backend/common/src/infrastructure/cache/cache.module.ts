import { CacheExplorer } from '../cache/cache.explorer';
import { CacheService } from '../cache/cache.service';
import { Module } from '../../core/decorators/module.decorator';
import { DynamicModule } from '../../domain/interfaces/common.interface';

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
