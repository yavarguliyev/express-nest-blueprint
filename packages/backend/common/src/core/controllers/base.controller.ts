import { BaseControllerOptions, ApiVersionConfig } from '../../domain/interfaces/api/api.interface';

export abstract class BaseController {
  protected readonly apiVersion: string;
  protected readonly apiPrefix: string;
  protected readonly basePath: string;

  constructor (options: BaseControllerOptions) {
    this.apiVersion = options.version || 'v1';
    this.apiPrefix = options.prefix || 'api';
    this.basePath = options.path;
  }

  protected getApiPath (): string {
    return `/${this.apiPrefix}/${this.apiVersion}${this.basePath}`;
  }

  protected getVersionInfo (): ApiVersionConfig {
    return { version: this.apiVersion, prefix: this.apiPrefix };
  }
}
