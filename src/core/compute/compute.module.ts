import { ChildProcess } from 'child_process';

import { COMPUTE_MODULE_OPTIONS } from '@common/decorators/bullmq.decorators';
import { Module } from '@common/decorators/module.decorator';
import { AppRoles } from '@common/enums/common.enum';
import { spawnWorker } from '@common/helpers/utility-functions.helper';
import { ComputeModuleOptions } from '@common/interfaces/bullmq.interface';
import { DynamicModule } from '@common/interfaces/common.interface';
import { BullMQModule } from '@core/bullmq/bullmq.module';
import { ComputeExplorer } from '@core/compute/compute.explorer';
import { ComputeService } from '@core/compute/compute.service';
import { LifecycleService } from '@core/lifecycle/lifecycle.service';
import { ConfigService } from '@core/config/config.service';

@Module({
  imports: [],
  providers: [],
  exports: []
})
export class ComputeModule {
  static forRoot (): DynamicModule {
    return {
      module: ComputeModule,
      global: true,
      imports: [BullMQModule.forRoot()],
      providers: [
        {
          provide: COMPUTE_MODULE_OPTIONS,
          useFactory: ((configService: ConfigService) => {
            const role = configService.get<string>('APP_ROLE', AppRoles.API) as AppRoles;
            const autoSpawn = configService.get<boolean>('COMPUTE_AUTO_SPAWN', true);

            return {
              enableWorker: role === AppRoles.WORKER || !role,
              enableApi: role !== AppRoles.WORKER,
              autoSpawn: autoSpawn,
              workerMinCount: configService.get<number>('COMPUTE_MIN_WORKERS', 3),
              workerMaxCount: configService.get<number>('COMPUTE_MAX_WORKERS', 8)
            };
          }) as (...args: unknown[]) => unknown,
          inject: [ConfigService]
        },
        ComputeService,
        ComputeExplorer,
        {
          provide: 'COMPUTE_INITIALIZER',
          useFactory: (...args: unknown[]): (() => void) => {
            const [explorer, computeService, lifecycleService, options, configService] = args as [ComputeExplorer, ComputeService, LifecycleService, ComputeModuleOptions, ConfigService];
            const role = configService.get<string>('APP_ROLE', AppRoles.API) as AppRoles;

            return () => {
              computeService.start();
              explorer.explore();

              if (lifecycleService) {
                lifecycleService.registerShutdownHandler({ name: 'Compute Service', disconnect: () => computeService.close() });

                if (options.enableApi && options.autoSpawn && role === AppRoles.API) {
                  lifecycleService.registerWorkerStarter(() => {
                    const entryPoint = require.main?.filename ?? process.argv[1] ?? '';
                    if (!entryPoint) return;

                    if (!entryPoint) return;

                    const computedOptions = {
                      workerMinCount: configService.get<number>('COMPUTE_MIN_WORKERS', 3),
                      workerMaxCount: configService.get<number>('COMPUTE_MAX_WORKERS', 8)
                    };

                    const count = Math.min(Math.max(computedOptions.workerMinCount ?? 3, 1), Math.max(computedOptions.workerMaxCount ?? 10, 1));

                    for (let i = 0; i < count; i++) {
                      const workerProcess = spawnWorker(entryPoint);

                      if (workerProcess instanceof ChildProcess) {
                        lifecycleService.registerShutdownHandler({
                          name: `WorkerProcess-${i + 1}`,
                          disconnect: async () => {
                            if (workerProcess.killed || workerProcess.exitCode !== null) return;

                            return new Promise<void>((resolve) => {
                              const timer = setTimeout(() => {
                                workerProcess.kill('SIGKILL');
                                resolve();
                              }, 1000);

                              workerProcess.once('exit', () => {
                                clearTimeout(timer);
                                resolve();
                              });

                              workerProcess.kill('SIGTERM');
                            });
                          }
                        });
                      }
                    }
                  });
                }
              }
            };
          },
          inject: [ComputeExplorer, ComputeService, LifecycleService, COMPUTE_MODULE_OPTIONS, ConfigService]
        }
      ],
      exports: [ComputeService, 'COMPUTE_INITIALIZER']
    };
  }
}
