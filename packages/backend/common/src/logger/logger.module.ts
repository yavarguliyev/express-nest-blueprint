import { getLoggerConfig } from '../config/logger.config';
import { DynamicModule, LoggerModuleOptions } from '../interfaces/common.interface';
import { Logger } from '../logger/logger.service';

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
