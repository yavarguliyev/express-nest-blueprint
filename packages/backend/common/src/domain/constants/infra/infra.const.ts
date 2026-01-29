import { LogLevel } from '../../enums/infra/infra.enum';

export const levelMap: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'error',
  [LogLevel.WARN]: 'warn',
  [LogLevel.LOG]: 'info',
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.VERBOSE]: 'verbose'
};
