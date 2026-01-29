import { BullMQService } from './services/bullmq.service';
import { QueueManager } from './services/queue-manager.service';
import { Module } from '../../core/decorators/module.decorator';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';

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
