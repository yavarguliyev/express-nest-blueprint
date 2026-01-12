import { Module, STORAGE_OPTIONS } from '@common/decorators';
import { DynamicModule } from '@common/interfaces';
import { BadRequestException } from '@common/exceptions';
import { StorageModuleOptions } from '@core/storage/storage.interface';
import { S3StorageStrategy } from '@core/storage/strategies/s3-storage.strategy';
import { StorageService } from '@core/storage/storage.service';

@Module({})
export class StorageModule {
  static forRoot (options: StorageModuleOptions): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      providers: [
        {
          provide: STORAGE_OPTIONS,
          useValue: options
        },
        {
          provide: StorageService,
          useFactory: ((opts: StorageModuleOptions) => {
            if (opts.strategy === 's3') {
              return new S3StorageStrategy(opts);
            }

            throw new BadRequestException(`Storage strategy ${opts.strategy} is not implemented`);
          }) as (...args: unknown[]) => unknown,
          inject: [STORAGE_OPTIONS]
        }
      ],
      exports: [StorageService]
    };
  }
}
