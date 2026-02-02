import winston from 'winston';

import { ConfigService } from '../config/config.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { LoggerOptions } from '../../domain/interfaces/infra/infra-common.interface';
import { levelMap } from '../../domain/constants/infra/infra.const';
import { LogLevel } from '../../domain/enums/infra/infra.enum';

@Injectable()
export class Logger {
  private static globalOptions: LoggerOptions = { timestamp: true, logLevel: LogLevel.LOG };
  private static settingsService: { isDebugLoggingEnabled(): Promise<boolean> } | null = null;

  private static winstonLogger: winston.Logger;
  private context?: string | undefined;

  constructor (context?: string) {
    this.context = context;

    if (!Logger.winstonLogger) {
      Logger.initializeWinston();
    }
  }

  static setSettingsService (settingsService: { isDebugLoggingEnabled(): Promise<boolean> }): void {
    Logger.settingsService = settingsService;
  }

  private static getFormat (): winston.Logform.Format {
    if (ConfigService.isProduction()) {
      return winston.format.combine(winston.format.timestamp(), winston.format.json());
    }

    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.colorize({ all: true }),
      winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const timestampRaw = info['timestamp'];
        const isValidTimestamp = typeof timestampRaw === 'string' || typeof timestampRaw === 'number';
        const timestampStr = isValidTimestamp ? String(timestampRaw) : '';
        const levelStr = String(info['level']);
        const messageStr = String(info['message']);
        const context = info['context'];
        const contextStr = typeof context === 'string' ? ` [${context}]` : '';

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

  private async shouldLog (level: LogLevel): Promise<boolean> {
    const baseCheck = level <= (Logger.globalOptions.logLevel || LogLevel.LOG);

    if (level === LogLevel.DEBUG || level === LogLevel.VERBOSE) {
      if (Logger.settingsService) {
        try {
          const debugEnabled = await Logger.settingsService.isDebugLoggingEnabled();
          return baseCheck && debugEnabled;
        } catch {
          return baseCheck;
        }
      }
    }

    return baseCheck;
  }

  static setGlobalOptions (options: Partial<LoggerOptions>): void {
    Logger.globalOptions = { ...Logger.globalOptions, ...options };
    Logger.initializeWinston();
  }

  async log (message: string, context?: string): Promise<void> {
    if (await this.shouldLog(LogLevel.LOG)) {
      Logger.winstonLogger.info(message, { context: context || this.context });
    }
  }

  async error (message: string, trace?: string, context?: string): Promise<void> {
    if (await this.shouldLog(LogLevel.ERROR)) {
      const errorContext = context || this.context;

      if (trace) {
        Logger.winstonLogger.error(message, { context: errorContext, stack: trace });
      } else {
        Logger.winstonLogger.error(message, { context: errorContext });
      }
    }
  }

  async warn (message: string, context?: string): Promise<void> {
    if (await this.shouldLog(LogLevel.WARN)) {
      Logger.winstonLogger.warn(message, { context: context || this.context });
    }
  }

  async debug (message: string, context?: string): Promise<void> {
    if (await this.shouldLog(LogLevel.DEBUG)) {
      Logger.winstonLogger.debug(message, { context: context || this.context });
    }
  }

  async verbose (message: string, context?: string): Promise<void> {
    if (await this.shouldLog(LogLevel.VERBOSE)) {
      Logger.winstonLogger.verbose(message, { context: context || this.context });
    }
  }

  static log (message: string, context?: string): void {
    void new Logger(context).log(message);
  }

  static error (message: string, trace?: string, context?: string): void {
    void new Logger(context).error(message, trace);
  }

  static warn (message: string, context?: string): void {
    void new Logger(context).warn(message);
  }

  static debug (message: string, context?: string): void {
    void new Logger(context).debug(message);
  }

  static verbose (message: string, context?: string): void {
    void new Logger(context).verbose(message);
  }
}
