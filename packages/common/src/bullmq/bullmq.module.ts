import { Module } from '../decorators/module.decorator';
import { DynamicModule } from '../interfaces/common.interface';
import { BullMQService } from '../bullmq/services/bullmq.service';
import { QueueManager } from '../bullmq/services/queue-manager.service';

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
