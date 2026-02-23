import { ConfigService } from './config.service';
import { LogLevel } from '../../domain/enums/infra/infra.enum';
import { LoggerOptions } from '../../domain/interfaces/infra/infra-common.interface';

export const getLoggerConfig = (): LoggerOptions => ({ timestamp: true, logLevel: ConfigService.isProduction() ? LogLevel.LOG : LogLevel.DEBUG });
