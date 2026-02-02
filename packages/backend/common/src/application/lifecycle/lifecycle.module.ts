import { LifecycleService } from './lifecycle.service';
import { handleProcessSignals } from '../../domain/helpers/utility-functions.helper';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';
import { ConfigService } from '../../infrastructure/config/config.service';
import { AppRoles } from '../../domain/enums/auth/auth.enum';

export class LifecycleModule {
  static forRoot (): DynamicModule {
    return {
      module: LifecycleModule,
      global: true,
      providers: [
        LifecycleService,
        {
          provide: 'LIFECYCLE_INITIALIZER',
          useFactory: ((lifecycleService: LifecycleService, configService: ConfigService) => () =>
            LifecycleModule.initProcessSignals(lifecycleService, configService)) as (...args: unknown[]) => unknown,
          inject: [LifecycleService, ConfigService]
        }
      ],
      exports: [LifecycleService, 'LIFECYCLE_INITIALIZER']
    };
  }

  private static initProcessSignals (service: LifecycleService, configService: ConfigService): void {
    const role = configService.get<string>('APP_ROLE', AppRoles.API) as AppRoles;
    handleProcessSignals({
      shutdownCallback: service.executeGracefulShutdown.bind(service),
      callbackArgs: [],
      role
    });
  }
}
