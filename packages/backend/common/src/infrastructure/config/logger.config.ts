import { LogLevel } from '../../domain/enums/infra/infra.enum';
import { LoggerOptions } from '../../domain/interfaces/infra/infra-common.interface';

export const getLoggerConfig = (): LoggerOptions => {
  const env = process.env['NODE_ENV'] || 'development';
  const logLevel = env === 'production' ? LogLevel.LOG : LogLevel.DEBUG;

  return { timestamp: true, logLevel };
};
