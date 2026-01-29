import { getLoggerConfig } from '../config/logger.config';
import { Logger } from '../logger/logger.service';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';
import { LoggerModuleOptions } from '../../domain/interfaces/infra/infra-common.interface';

export class LoggerModule {
  static forRoot (options: LoggerModuleOptions = {}): DynamicModule {
    const { config } = options;

    return {
      module: LoggerModule,
      global: true,
      providers: [
        {
          provide: 'LOGGER_INITIALIZER',
          useFactory: (): (() => void) => () => Logger.setGlobalOptions(config || getLoggerConfig()),
          inject: []
        }
      ],
      exports: ['LOGGER_INITIALIZER']
    };
  }
}
