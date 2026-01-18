import { LogLevel } from '../enums/common.enum';
import { LoggerOptions } from '../interfaces/common.interface';

export const getLoggerConfig = (): LoggerOptions => {
  const env = process.env['NODE_ENV'] || 'development';
  const logLevel = env === 'production' ? LogLevel.LOG : LogLevel.DEBUG;

  return { timestamp: true, logLevel };
};
