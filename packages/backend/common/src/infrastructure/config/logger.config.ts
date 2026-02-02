import { LogLevel } from '../../domain/enums/infra/infra.enum';
import { LoggerOptions } from '../../domain/interfaces/infra/infra-common.interface';
import { ConfigService } from './config.service';

export const getLoggerConfig = (): LoggerOptions => {
  const logLevel = ConfigService.isProduction() ? LogLevel.LOG : LogLevel.DEBUG;
  return { timestamp: true, logLevel };
};
