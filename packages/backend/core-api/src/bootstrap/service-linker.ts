import { NestApplication, Logger, MaintenanceMiddleware } from '@config/libs';

import { SettingsService } from '@modules/settings/settings.service';
import { AuthService } from '@modules/auth/auth.service';

export class ServiceLinker {
  static link (app: NestApplication): void {
    const settingsService = app.get(SettingsService);
    const authService = app.get(AuthService);
    const maintenanceMiddleware = app.get(MaintenanceMiddleware);

    Logger.setSettingsService(settingsService);
    authService.setSettingsService(settingsService);
    maintenanceMiddleware.setSettingsService(settingsService);
  }
}
