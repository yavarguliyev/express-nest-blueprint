import { Module, Inject } from '@common/decorators';
import { AppRoles } from '@common/enums';
import { LoggerModule } from '@common/logger';
import { LoggerMiddleware } from '@common/middleware';
import { JwtService } from '@common/services';
import { CacheModule } from '@core/cache/cache.module';
import { ComputeModule } from '@core/compute';
import { computeConfig } from '@core/config';
import { DatabaseModule } from '@core/database';
import { LifecycleModule } from '@core/lifecycle';
import { RedisModule } from '@core/redis/redis.module';
import { StorageModule } from '@core/storage/storage.module';

@Module({
  imports: [
    LoggerModule.forRoot(),
    LifecycleModule.forRoot(),
    DatabaseModule.forRoot(),
    RedisModule.forRoot({
      redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
        password: process.env['REDIS_PASSWORD'] || '',
        db: parseInt(process.env['REDIS_DB'] || '0', 10)
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    }),
    CacheModule.forRoot(),
    ComputeModule.forRoot({
      enableWorker: computeConfig.COMPUTE_APP_ROLE === AppRoles.WORKER || !computeConfig.COMPUTE_APP_ROLE,
      enableApi: computeConfig.COMPUTE_APP_ROLE !== AppRoles.WORKER,
      autoSpawn: computeConfig.COMPUTE_AUTO_SPAWN,
      workerMinCount: computeConfig.COMPUTE_MIN_WORKERS,
      workerMaxCount: computeConfig.COMPUTE_MAX_WORKERS
    }),
    StorageModule.forRoot({
      strategy: (process.env['STORAGE_STRATEGY'] || 's3') as 's3' | 'local',
      s3: {
        endpoint: process.env['STORAGE_ENDPOINT'],
        accessKeyId: process.env['STORAGE_ACCESS_KEY'] || '',
        secretAccessKey: process.env['STORAGE_SECRET_KEY'] || '',
        region: process.env['STORAGE_REGION'] || 'us-east-1',
        bucketName: process.env['STORAGE_BUCKET_NAME'] || 'express-nest-blueprint',
        forcePathStyle: process.env['STORAGE_FORCE_PATH_STYLE'] === 'true'
      }
    })
  ],
  controllers: [],
  providers: [
    LoggerMiddleware,
    JwtService,
    {
      provide: 'APP_INITIALIZER',
      useFactory: (async (...initializers: Array<() => Promise<void> | void>): Promise<void> => {
        for (const init of initializers) {
          if (typeof init === 'function') {
            const result = init();
            if (result instanceof Promise) await result;
          }
        }
      }) as (...args: unknown[]) => Promise<void>,
      inject: ['LOGGER_INITIALIZER', 'LIFECYCLE_INITIALIZER', 'DATABASE_INITIALIZER', 'REDIS_INITIALIZER', 'COMPUTE_INITIALIZER', 'CACHE_INITIALIZER']
    }
  ],
  exports: [JwtService]
})
export class SharedModule {
  constructor (@Inject('APP_INITIALIZER') _initializer: unknown) {
    void _initializer;
  }
}
