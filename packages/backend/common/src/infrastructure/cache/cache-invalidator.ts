import { CacheService } from './cache.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { CrudTableOptions } from '../../domain/interfaces/database/database-common.interface';

@Injectable()
export class CacheInvalidator {
  constructor (private readonly cacheService: CacheService) {}

  async invalidateCache (metadata: CrudTableOptions, id?: string | number): Promise<void> {
    if (!metadata.cacheConfig) return;
    if (metadata.cacheConfig.prefix) await this.cacheService.invalidateTags([metadata.cacheConfig.prefix]);
    if (id && metadata.cacheConfig.detailKey) await this.cacheService.delete(metadata.cacheConfig.detailKey(id));
  }
}
