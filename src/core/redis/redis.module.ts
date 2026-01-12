import { Module, BULLMQ_OPTIONS } from '@common/decorators';
import { BullMQModuleOptions, DynamicModule } from '@common/interfaces';
import { RedisService } from '@core/redis/redis.service';
import { LifecycleService } from '@core/lifecycle/lifecycle.service';

@Module({
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {
  static forRoot (options: BullMQModuleOptions): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [
        {
          provide: BULLMQ_OPTIONS,
          useValue: options
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
