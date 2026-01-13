import winston from 'winston';

import { levelMap } from '@common/constants/system.const';
import { Injectable } from '@common/decorators/injectable.decorator';
import { LogLevel } from '@common/enums';
import { LoggerOptions } from '@common/interfaces/common.interface';

@Injectable()
export class Logger {
  private static globalOptions: LoggerOptions = { timestamp: true, logLevel: LogLevel.LOG };

  private static winstonLogger: winston.Logger;
  private context?: string | undefined;

  constructor (context?: string) {
    this.context = context;

    if (!Logger.winstonLogger) {
      Logger.initializeWinston();
    }
  }

  private static getFormat (): winston.Logform.Format {
    if (process.env.NODE_ENV === 'production') {
      return winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      );
    }

    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const timestampRaw = info['timestamp'];
        const isValidTimestamp = typeof timestampRaw === 'string' || typeof timestampRaw === 'number';
        const timestampStr = isValidTimestamp ? String(timestampRaw) : '';
        const levelStr = String(info['level']);
        const messageStr = String(info['message']);
        const contextStr = info['context'] ? ` [${String(info['context'])}]` : '';

        return `${timestampStr}${contextStr} [${levelStr}]: ${messageStr}`;
      })
    );
  }

  private static initializeWinston (): void {
    const logLevel = Logger.getWinstonLevel(Logger.globalOptions.logLevel || LogLevel.LOG);
    const format = this.getFormat();

    Logger.winstonLogger = winston.createLogger({
      level: logLevel,
      format,
      transports: [new winston.transports.Console({ level: logLevel, format })]
    });
  }

  private static getWinstonLevel (logLevel: LogLevel): string {
    return levelMap[logLevel] ?? 'info';
  }

  private shouldLog (level: LogLevel): boolean {
    return level <= (Logger.globalOptions.logLevel || LogLevel.LOG);
  }

  static setGlobalOptions (options: Partial<LoggerOptions>): void {
    Logger.globalOptions = { ...Logger.globalOptions, ...options };
    Logger.initializeWinston();
  }

  log (message: string, context?: string): void {
    if (this.shouldLog(LogLevel.LOG)) {
      Logger.winstonLogger.info(message, { context: context || this.context });
    }
  }

  error (message: string, trace?: string, context?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = context || this.context;

      if (trace) {
        Logger.winstonLogger.error(message, { context: errorContext, stack: trace });
      } else {
        Logger.winstonLogger.error(message, { context: errorContext });
      }
    }
  }

  warn (message: string, context?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      Logger.winstonLogger.warn(message, { context: context || this.context });
    }
  }

  debug (message: string, context?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      Logger.winstonLogger.debug(message, { context: context || this.context });
    }
  }

  verbose (message: string, context?: string): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      Logger.winstonLogger.verbose(message, { context: context || this.context });
    }
  }

  static log (message: string, context?: string): void {
    new Logger(context).log(message);
  }

  static error (message: string, trace?: string, context?: string): void {
    new Logger(context).error(message, trace);
  }

  static warn (message: string, context?: string): void {
    new Logger(context).warn(message);
  }

  static debug (message: string, context?: string): void {
    new Logger(context).debug(message);
  }

  static verbose (message: string, context?: string): void {
    new Logger(context).verbose(message);
  }
}
