import { LogLevel } from '@common/enums';
import { LoggerOptions } from '@common/interfaces';

export const getLoggerConfig = (): LoggerOptions => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = env === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  return { timestamp: true, logLevel };
};
