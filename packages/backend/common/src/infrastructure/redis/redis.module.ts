import { ConfigService } from '../config/config.service';
import { BULLMQ_OPTIONS } from '../../core/decorators/bullmq.decorators';
import { Module } from '../../core/decorators/module.decorator';
import { DynamicModule } from '../../domain/interfaces/common.interface';
import { RedisService } from '../redis/redis.service';
import { LifecycleService } from '../../application/lifecycle/lifecycle.service';

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
