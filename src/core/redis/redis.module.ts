import { Module, BULLMQ_OPTIONS } from '@common/decorators';
import { DynamicModule } from '@common/interfaces';
import { RedisService } from '@core/redis/redis.service';
import { LifecycleService } from '@core/lifecycle/lifecycle.service';
import { ConfigService } from '@core/config';

@Module({
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {
  static forRoot (): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [
        {
          provide: BULLMQ_OPTIONS,
          useFactory: ((configService: ConfigService) => ({
            redis: {
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
              password: configService.get<string>('REDIS_PASSWORD', ''),
              db: configService.get<number>('REDIS_DB', 0)
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
          })) as (...args: unknown[]) => unknown,
          inject: [ConfigService]
        },
        RedisService,
        {
          provide: 'REDIS_INITIALIZER',
          useFactory: ((redisService: RedisService, lifecycleService: LifecycleService) => {
            return (): void => lifecycleService && lifecycleService.registerShutdownHandler({ name: 'Redis Service', disconnect: () => redisService.disconnect() });
          }) as (...args: unknown[]) => unknown,
          inject: [RedisService, LifecycleService]
        }
      ],
      exports: [RedisService, BULLMQ_OPTIONS, 'REDIS_INITIALIZER']
    };
  }
}
