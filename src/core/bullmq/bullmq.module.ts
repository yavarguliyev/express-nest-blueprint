import { Module } from '@common/decorators';
import { DynamicModule } from '@common/interfaces';
import { BullMQService } from '@core/bullmq/services/bullmq.service';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';

@Module({
  providers: [QueueManager, BullMQService]
})
export class BullMQModule {
  static forRoot (): DynamicModule {
    return {
      module: BullMQModule,
      providers: [QueueManager, BullMQService],
      exports: [BullMQService]
    };
  }
}
