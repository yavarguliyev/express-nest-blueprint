import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

import { parsers } from '../constants/system.const';
import { Injectable } from '../decorators/injectable.decorator';
import { BadRequestException } from '../exceptions/http-exceptions';
import { ConfigModuleOptions } from '../interfaces/common.interface';
import { Logger } from '../logger/logger.service';
import { ParserType } from '../types/common.type';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private static options: ConfigModuleOptions = {};
  private envVariables: Record<string, string> = {};

  constructor () {
    this.loadEnvironmentVariables();
  }

  static setOptions (options: ConfigModuleOptions): void {
    ConfigService.options = options;
  }

  get<T = string>(key: string): T | undefined;
  get<T = string>(key: string, defaultValue: T): T;
  get<T = string> (key: string, defaultValue?: T): T | undefined {
    const value = this.envVariables[key];
    if (!value) return defaultValue;
    return this.parseValue<T>(value, defaultValue);
  }

  getOrThrow<T = string> (key: string): T {
    const value = this.get<T>(key);
    if (!value) throw new BadRequestException(`Environment variable "${key}" is not defined`);
    return value;
  }

  getAllKeys (): string[] {
    return Object.keys(this.envVariables);
  }

  has (key: string): boolean {
    return key in this.envVariables;
  }

  private parseValue<T> (value: string, defaultValue?: T): T {
    const valueLower = value.toLowerCase();

    if (defaultValue !== undefined) {
      const parser = parsers[typeof defaultValue as ParserType];
      return parser(value, defaultValue) as T;
    }

    if (valueLower === 'true' || valueLower === 'false') return parsers['boolean'](value) as T;
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return num as unknown as T;

    return value as unknown as T;
  }

  private loadEnvironmentVariables (): void {
    const { envFilePath = '.env', ignoreEnvFile = false } = ConfigService.options;

    if (!ignoreEnvFile) {
      const envPath = resolve(process.cwd(), envFilePath);

      if (existsSync(envPath)) {
        const result = config({ path: envPath });

        if (result.error) this.logger.error('Failed to load environment file', result.error.message);
      }
    }

    this.envVariables = { ...process.env } as Record<string, string>;
  }
}
