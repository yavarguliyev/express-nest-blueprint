import { Response, NextFunction } from 'express';

import { Injectable } from '../decorators/injectable.decorator';
import { UserRoles } from '../../domain/enums/common.enum';
import { ServiceUnavailableException } from '../../domain/exceptions/http-exceptions';
import { AuthenticatedRequest } from '../../domain/interfaces/common.interface';

@Injectable()
export class MaintenanceMiddleware {
  private isMaintenanceMode = false;
  private settingsService: { isMaintenanceModeEnabled(): Promise<boolean> } | null = null;

  setSettingsService (settingsService: { isMaintenanceModeEnabled(): Promise<boolean> }): void {
    this.settingsService = settingsService;
  }

  async use (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (this.settingsService) {
        this.isMaintenanceMode = await this.settingsService.isMaintenanceModeEnabled();
      }

      if (req.user && req.user.role !== UserRoles.GLOBAL_ADMIN && this.isMaintenanceMode) {
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
