import { ChildProcess } from 'child_process';

import { Module, COMPUTE_MODULE_OPTIONS } from '@common/decorators';
import { AppRoles } from '@common/enums';
import { spawnWorker } from '@common/helpers';
import { DynamicModule, ComputeModuleOptions } from '@common/interfaces';
import { computeConfig } from '@core/config';
import { BullMQModule } from '@core/bullmq/bullmq.module';
import { ComputeExplorer } from '@core/compute/compute.explorer';
import { ComputeService } from '@core/compute/compute.service';
import { LifecycleService } from '@core/lifecycle';

@Module({
  imports: [],
  providers: [],
  exports: []
})
export class ComputeModule {
  static forRoot (options: ComputeModuleOptions = { enableWorker: true, enableApi: true }): DynamicModule {
    return {
      module: ComputeModule,
      global: true,
      imports: [BullMQModule.forRoot()],
      providers: [
        {
          provide: COMPUTE_MODULE_OPTIONS,
          useValue: options
        },
        ComputeService,
        ComputeExplorer,
        {
          provide: 'COMPUTE_INITIALIZER',
          useFactory: (...args: unknown[]): (() => void) => {
            const [explorer, computeService, lifecycleService] = args as [ComputeExplorer, ComputeService, LifecycleService];
            const role = computeConfig.COMPUTE_APP_ROLE;

            return () => {
              computeService.start();
              explorer.explore();

              if (lifecycleService) {
                lifecycleService.registerShutdownHandler({ name: 'Compute Service', disconnect: () => computeService.close() });

                if (options.enableApi && options.autoSpawn && role === AppRoles.API) {
                  lifecycleService.registerWorkerStarter(() => {
                    const entryPoint = require.main?.filename ?? process.argv[1] ?? '';
                    if (!entryPoint) return;

                    const count = Math.min(Math.max(options.workerMinCount ?? 3, 1), Math.max(options.workerMaxCount ?? 10, 1));

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
          inject: [ComputeExplorer, ComputeService, LifecycleService]
        }
      ],
      exports: [ComputeService, 'COMPUTE_INITIALIZER']
    };
  }
}
