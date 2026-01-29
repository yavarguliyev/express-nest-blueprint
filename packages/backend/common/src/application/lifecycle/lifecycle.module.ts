import { LifecycleService } from './lifecycle.service';
import { handleProcessSignals } from '../../domain/helpers/utility-functions.helper';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';

export class LifecycleModule {
  static forRoot (): DynamicModule {
    return {
      module: LifecycleModule,
      global: true,
      providers: [
        LifecycleService,
        {
          provide: 'LIFECYCLE_INITIALIZER',
          useFactory: ((lifecycleService: LifecycleService) => () => LifecycleModule.initProcessSignals(lifecycleService)) as (
            ...args: unknown[]
          ) => unknown,
          inject: [LifecycleService]
        }
      ],
      exports: [LifecycleService, 'LIFECYCLE_INITIALIZER']
    };
  }

  private static initProcessSignals (service: LifecycleService): void {
    handleProcessSignals({
      shutdownCallback: service.executeGracefulShutdown.bind(service),
      callbackArgs: []
    });
  }
}
