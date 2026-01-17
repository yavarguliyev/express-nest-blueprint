import { STORAGE_OPTIONS } from '../decorators/bullmq.decorators';
import { Module } from '../decorators/module.decorator';
import { DynamicModule } from '../interfaces/common.interface';
import { BadRequestException } from '../exceptions/http-exceptions';
import { S3StorageStrategy } from '../storage/strategies/s3-storage.strategy';
import { StorageModuleOptions } from '../storage/storage.interface';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../config/config.service';

@Module({})
export class StorageModule {
  static forRoot (): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      providers: [
        {
          provide: STORAGE_OPTIONS,
          useFactory: ((configService: ConfigService) => ({
            strategy: configService.get<string>('STORAGE_STRATEGY', 's3') as 's3' | 'local',
            s3: {
              endpoint: configService.get<string>('STORAGE_ENDPOINT'),
              publicEndpoint: configService.get<string>('STORAGE_PUBLIC_ENDPOINT'),
              accessKeyId: configService.get<string>('STORAGE_ACCESS_KEY', ''),
              secretAccessKey: configService.get<string>('STORAGE_SECRET_KEY', ''),
              region: configService.get<string>('STORAGE_REGION', 'us-east-1'),
              bucketName: configService.get<string>('STORAGE_BUCKET_NAME', 'express-nest-blueprint'),
              forcePathStyle: configService.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true'
            }
          })) as (...args: unknown[]) => unknown,
          inject: [ConfigService]
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
