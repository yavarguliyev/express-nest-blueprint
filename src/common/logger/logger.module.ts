import { DynamicModule, LoggerModuleOptions } from '@common/interfaces';
import { Logger } from '@common/logger/logger.service';
import { getLoggerConfig } from '@core/config';

export class LoggerModule {
  static forRoot (options: LoggerModuleOptions = {}): DynamicModule {
    const { config } = options;

    return {
      module: LoggerModule,
      global: true,
      providers: [
        {
          provide: 'LOGGER_INITIALIZER',
          useFactory: (): (() => Promise<void>) => async () => Logger.setGlobalOptions(config || getLoggerConfig()),
          inject: []
        }
      ],
      exports: ['LOGGER_INITIALIZER']
    };
  }
}
