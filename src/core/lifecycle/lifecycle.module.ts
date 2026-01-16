import { DynamicModule } from '@common/interfaces/common.interface';
import { handleProcessSignals } from '@common/helpers/utility-functions.helper';
import { LifecycleService } from '@core/lifecycle/lifecycle.service';

export class LifecycleModule {
  static forRoot (): DynamicModule {
    return {
      module: LifecycleModule,
      global: true,
      providers: [
        LifecycleService,
        {
          provide: 'LIFECYCLE_INITIALIZER',
          useFactory: ((lifecycleService: LifecycleService): (() => void) => {
            return () => handleProcessSignals({ shutdownCallback: lifecycleService.executeGracefulShutdown.bind(lifecycleService), callbackArgs: [] });
          }) as (...args: unknown[]) => unknown,
          inject: [LifecycleService]
        }
      ],
      exports: [LifecycleService, 'LIFECYCLE_INITIALIZER']
    };
  }
}
