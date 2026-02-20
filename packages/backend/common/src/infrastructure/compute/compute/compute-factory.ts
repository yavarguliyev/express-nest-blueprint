import { ChildProcess } from 'child_process';

import { ComputeExplorer } from '../compute.explorer';
import { ComputeService } from '../compute.service';
import { ConfigService } from '../../config/config.service';
import { LifecycleService } from '../../../application/lifecycle/lifecycle.service';
import { ComputeModuleOptions } from '../../../domain/interfaces/infra/bullmq.interface';
import { AppRoles } from '../../../domain/enums/auth/auth.enum';
import { spawnWorker } from '../../../domain/helpers/utility-functions.helper';

export const createComputeInitializer = (
  explorer: ComputeExplorer,
  computeService: ComputeService,
  lifecycleService: LifecycleService,
  options: ComputeModuleOptions,
  configService: ConfigService
): (() => void) => {
  const role = configService.get<string>('APP_ROLE', AppRoles.API) as AppRoles;

  return () => {
    computeService.start();
    explorer.explore();

    if (lifecycleService) {
      lifecycleService.registerShutdownHandler({
        name: 'Compute Service',
        disconnect: () => computeService.close()
      });

      if (options.enableApi && options.autoSpawn && role === AppRoles.API) {
        lifecycleService.registerWorkerStarter(() => {
          startWorkerProcesses(lifecycleService, configService, role);
        });
      }
    }
  };
};

const startWorkerProcesses = (lifecycleService: LifecycleService, configService: ConfigService, role: AppRoles): void => {
  const entryPoint = require.main?.filename ?? process.argv[1] ?? '';
  if (!entryPoint) return;

  const computedOptions = {
    workerMinCount: configService.get<number>('COMPUTE_MIN_WORKERS', 3),
    workerMaxCount: configService.get<number>('COMPUTE_MAX_WORKERS', 8)
  };

  const count = Math.min(Math.max(computedOptions.workerMinCount ?? 3, 1), Math.max(computedOptions.workerMaxCount ?? 10, 1));

  for (let i = 0; i < count; i++) {
    const workerProcess = spawnWorker(entryPoint, role);

    if (workerProcess instanceof ChildProcess) {
      registerWorkerShutdownHandler(lifecycleService, workerProcess, i);
    }
  }
};

const registerWorkerShutdownHandler = (lifecycleService: LifecycleService, workerProcess: ChildProcess, index: number): void => {
  lifecycleService.registerShutdownHandler({
    name: `WorkerProcess-${index + 1}`,
    disconnect: async () => {
      if (workerProcess.killed || workerProcess.exitCode !== null) return;

      return new Promise<void>(resolve => {
        const timer = setTimeout(() => {
          workerProcess.kill('SIGKILL');
          resolve();
        }, 200);

        workerProcess.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });

        workerProcess.kill('SIGTERM');
      });
    }
  });
};
