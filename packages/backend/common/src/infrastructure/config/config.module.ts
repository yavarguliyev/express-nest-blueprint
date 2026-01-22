import { ConfigService } from '../config/config.service';
import { Module } from '../../core/decorators/module.decorator';
import { ConfigModuleOptions, DynamicModule } from '../../domain/interfaces/common.interface';

@Module({
  providers: [ConfigService],
  exports: [ConfigService]
})
export class ConfigModule {
  static forRoot (options: ConfigModuleOptions = {}): DynamicModule {
    const moduleOptions = {
      isGlobal: false,
      envFilePath: '.env',
      ignoreEnvFile: false,
      ...options
    };

    ConfigService.setOptions(moduleOptions);

    return {
      module: ConfigModule,
      global: moduleOptions.isGlobal,
      providers: [ConfigService],
      exports: [ConfigService]
    };
  }
}
