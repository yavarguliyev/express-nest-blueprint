import { DynamicModule, LoggerModuleOptions } from '@common/interfaces/common.interface';
import { Logger } from '@common/logger/logger.service';
import { getLoggerConfig } from '@core/config/logger.config';

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
