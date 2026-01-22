import { LogLevel } from '../../domain/enums/common.enum';
import { LoggerOptions } from '../../domain/interfaces/common.interface';

export const getLoggerConfig = (): LoggerOptions => {
  const env = process.env['NODE_ENV'] || 'development';
  const logLevel = env === 'production' ? LogLevel.LOG : LogLevel.DEBUG;

  return { timestamp: true, logLevel };
};
