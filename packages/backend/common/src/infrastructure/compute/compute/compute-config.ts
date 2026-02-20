import { ConfigService } from '../../config/config.service';
import { ComputeModuleOptions } from '../../../domain/interfaces/infra/bullmq.interface';
import { AppRoles } from '../../../domain/enums/auth/auth.enum';

export function createComputeModuleOptions (configService: ConfigService): ComputeModuleOptions {
  const role = configService.get<string>('APP_ROLE', AppRoles.API) as AppRoles;
  const autoSpawn = configService.get<boolean>('COMPUTE_AUTO_SPAWN', true);

  return {
    enableWorker: role === AppRoles.WORKER || !role,
    enableApi: role !== AppRoles.WORKER,
    autoSpawn: autoSpawn,
    workerMinCount: configService.get<number>('COMPUTE_MIN_WORKERS', 3),
    workerMaxCount: configService.get<number>('COMPUTE_MAX_WORKERS', 8)
  };
}
