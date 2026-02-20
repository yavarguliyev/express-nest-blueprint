import { BullMQModule } from '../bullmq/bullmq.module';
import { ComputeExplorer } from '../compute/compute.explorer';
import { ComputeService } from '../compute/compute.service';
import { ConfigService } from '../config/config.service';
import { LifecycleService } from '../../application/lifecycle/lifecycle.service';
import { Module } from '../../core/decorators/module.decorator';
import { COMPUTE_MODULE_OPTIONS } from '../../core/decorators/bullmq.decorators';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';
import { createComputeModuleOptions } from './compute/compute-config';
import { createComputeInitializer } from './compute/compute-factory';

@Module({
  imports: [],
  providers: [],
  exports: []
})
export class ComputeModule {
  static forRoot (): DynamicModule {
    return {
      module: ComputeModule,
      global: true,
      imports: [BullMQModule.forRoot()],
      providers: [
        {
          provide: COMPUTE_MODULE_OPTIONS,
          useFactory: createComputeModuleOptions as (...args: unknown[]) => unknown,
          inject: [ConfigService]
        },
        ComputeService,
        ComputeExplorer,
        {
          provide: 'COMPUTE_INITIALIZER',
          useFactory: createComputeInitializer as (...args: unknown[]) => unknown,
          inject: [ComputeExplorer, ComputeService, LifecycleService, COMPUTE_MODULE_OPTIONS, ConfigService]
        }
      ],
      exports: [ComputeService, 'COMPUTE_INITIALIZER']
    };
  }
}
