import { BullMQExplorer } from './bullmq-explorer';
import { BullMQService } from './services/bullmq.service';
import { QueueManager } from './services/queue-manager.service';
import { LifecycleService } from '../../application/lifecycle/lifecycle.service';
import { Module } from '../../core/decorators/module.decorator';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';

@Module({
  providers: [QueueManager, BullMQService, BullMQExplorer]
})
export class BullMQModule {
  static forRoot (): DynamicModule {
    return {
      module: BullMQModule,
      global: true,
      providers: [
        QueueManager,
        BullMQService,
        BullMQExplorer,
        {
          provide: 'BULLMQ_INITIALIZER',
          useFactory: ((bullMQService: BullMQService, lifecycleService: LifecycleService) => {
            return (): Promise<void> => {
              if (lifecycleService) {
                lifecycleService.registerShutdownHandler({
                  name: 'BullMQ Service',
                  disconnect: () => bullMQService.closeAllQueues()
                });
              }
              return Promise.resolve();
            };
          }) as (...args: unknown[]) => unknown,
          inject: [BullMQService, LifecycleService]
        },
        {
          provide: 'BULLMQ_WORKER_INITIALIZER',
          useFactory: ((bullMQExplorer: BullMQExplorer, lifecycleService: LifecycleService) => {
            return (): void => {
              if (lifecycleService) {
                lifecycleService.registerShutdownHandler({
                  name: 'BullMQ Workers',
                  disconnect: () => bullMQExplorer.closeAll()
                });
              }
              bullMQExplorer.explore();
            };
          }) as (...args: unknown[]) => unknown,
          inject: [BullMQExplorer, LifecycleService]
        }
      ],
      exports: [BullMQService, BullMQExplorer, 'BULLMQ_INITIALIZER', 'BULLMQ_WORKER_INITIALIZER']
    };
  }
}
