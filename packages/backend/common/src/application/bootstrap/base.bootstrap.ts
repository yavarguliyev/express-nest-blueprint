import { GraphQLSetup } from './graphql.setup';
import { StaticAssetsSetup } from './static-assets.setup';
import { SwaggerSetup } from './swagger.setup';
import { LifecycleService } from '../lifecycle/lifecycle.service';
import { NestApplication } from '../nest-application';
import { NestFactory } from '../nest-factory';
import { AppRoles } from '../../domain/enums/auth/auth.enum';
import { AppName } from '../../domain/enums/common/common.enum';
import { BootstrapOptions } from '../../domain/interfaces/nest/nest-core.interface';
import { Constructor } from '../../domain/types/common/util.type';
import { ConfigService } from '../../infrastructure/config/config.service';
import { Logger } from '../../infrastructure/logger/logger.service';

export abstract class BaseBootstrap {
  protected lifecycleService?: LifecycleService;

  constructor (
    protected readonly appModule: Constructor,
    protected readonly options: BootstrapOptions = {}
  ) {}

  protected abstract onBindDependencies(app: NestApplication): Promise<void> | void;

  getOptions (): BootstrapOptions {
    return this.options;
  }

  async start (): Promise<void> {
    try {
      const app = await NestFactory.create(this.appModule, { appName: this.getAppName() });
      this.lifecycleService = app.get(LifecycleService);

      const configService = app.get(ConfigService);
      const role = this.resolveAppRole(configService);
      const { port, host } = this.resolveServerConfig(configService);

      await this.onBindDependencies(app);

      if (role === AppRoles.API) await this.bootstrapApi(app);
      else if (role === AppRoles.WORKER) await this.bootstrapWorker(app);
      else await app.listen(port, host);

      this.logStartupInfo(role, host, port);
    } catch {
      await this.handleStartupError();
    }
  }

  protected getAppName (): AppName {
    return this.options.appName ?? AppName.MAIN;
  }

  protected async bootstrapApi (app: NestApplication): Promise<void> {
    const configService = app.get(ConfigService);
    const { port, host } = this.resolveServerConfig(configService);

    SwaggerSetup.setup(app);
    GraphQLSetup.setup(app);
    StaticAssetsSetup.setup(app, this);

    const server = await app.listen(port, host);

    this.lifecycleService?.setHttpServer(server);
    this.lifecycleService?.startWorkers();
  }

  protected async bootstrapWorker (app: NestApplication): Promise<void> {
    const configService = app.get(ConfigService);
    const { port, host } = this.resolveServerConfig(configService);

    const server = await app.listen(port, host);

    this.lifecycleService?.setHttpServer(server);
    this.lifecycleService?.startWorkers();
  }

  protected resolveAppRole (config: ConfigService): AppRoles {
    const roleEnv = config.get<string>('APP_ROLE', AppRoles.API) || '';
    return roleEnv.trim().toUpperCase() as AppRoles;
  }

  protected resolveServerConfig (config: ConfigService): { port: number; host: string } {
    return {
      port: config.get<number>(this.options.portEnvVar || 'PORT', this.options.defaultPort || 3000),
      host: config.get<string>(this.options.hostEnvVar || 'HOST', this.options.defaultHost || '0.0.0.0')
    };
  }

  protected logStartupInfo (role: AppRoles, host: string, port: number): void {
    Logger.log(
      `${role === AppRoles.WORKER ? '💪 Background Worker' : '🚀 API Server'} started and listening on http://${host}:${port}`,
      this.constructor.name
    );
  }

  protected async handleStartupError (): Promise<void> {
    if (this.lifecycleService) await this.lifecycleService.executeGracefulShutdown();
    else process.exit(1);
  }
}
