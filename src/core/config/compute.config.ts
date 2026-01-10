import { AppRoles } from '@common/enums';
import { ComputeConfig } from '@common/interfaces';

export const computeConfig: ComputeConfig = {
  COMPUTE_AUTO_SPAWN: process.env['COMPUTE_AUTO_SPAWN'] === 'true' || !process.env['COMPUTE_AUTO_SPAWN'],
  COMPUTE_APP_ROLE: (process.env['APP_ROLE'] || process.env['COMPUTE_APP_ROLE'] || AppRoles.API) as AppRoles,
  COMPUTE_MIN_WORKERS: parseInt(process.env['COMPUTE_MIN_WORKERS'] || '3', 10),
  COMPUTE_MAX_WORKERS: parseInt(process.env['COMPUTE_MAX_WORKERS'] || '8', 10)
};
