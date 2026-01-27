import { LifecycleService } from './lifecycle.service';
import { DynamicModule } from '../../domain/interfaces/common.interface';
import { handleProcessSignals } from '../../domain/helpers/utility-functions.helper';

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
            return () =>
              handleProcessSignals({
                shutdownCallback: lifecycleService.executeGracefulShutdown.bind(lifecycleService),
                callbackArgs: []
              });
          }) as (...args: unknown[]) => unknown,
          inject: [LifecycleService]
        }
      ],
      exports: [LifecycleService, 'LIFECYCLE_INITIALIZER']
    };
  }
}
