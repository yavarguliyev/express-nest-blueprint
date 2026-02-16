import { Response, NextFunction } from 'express';

import { Injectable } from '../decorators/injectable.decorator';
import { UserRoles } from '../../domain/enums/auth/auth.enum';
import { ServiceUnavailableException } from '../../domain/exceptions/http-exceptions';
import { AuthenticatedRequest } from '../../domain/interfaces/auth/jwt.interface';

@Injectable()
export class MaintenanceMiddleware {
  private isMaintenanceMode = false;
  private settingsService: { isMaintenanceModeEnabled(): Promise<boolean> } | null = null;

  setSettingsService (settingsService: { isMaintenanceModeEnabled(): Promise<boolean> }): void {
    this.settingsService = settingsService;
  }

  async use (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const path = req.path || req.url || '';
    const isExcludedPath = path.includes('/settings') || path.includes('/health');

    if (isExcludedPath) {
      return next();
    }

    try {
      if (this.settingsService) this.isMaintenanceMode = await this.settingsService.isMaintenanceModeEnabled();

      if (this.isMaintenanceMode && req.user && req.user.role !== UserRoles.GLOBAL_ADMIN) {
        throw new ServiceUnavailableException('System is currently under maintenance. Please try again later.');
      }

      next();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        res.status(503).json({
          success: false,
          error: 'Service Unavailable',
          message: error.message,
          statusCode: 503
        });

        return;
      }

      next();
    }
  }

  setMaintenanceMode (enabled: boolean): void {
    this.isMaintenanceMode = enabled;
  }
}
