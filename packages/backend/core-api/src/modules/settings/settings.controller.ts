import { ApiController, Injectable, Get, Put, Body, Roles, UserRoles, BaseController } from '@config/libs';

import { SettingsService } from '@modules/settings/settings.service';
import { SettingsResponseDto } from './dtos/settings-response.dto';
import { UpdateSettingsDto } from './dtos/update-settings.dto';

@Injectable()
@ApiController({ path: '/settings' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class SettingsController extends BaseController {
  constructor (private readonly settingsService: SettingsService) {
    super({ path: '/settings' });
  }

  @Get()
  async getAllSettings (): Promise<SettingsResponseDto[]> {
    return this.settingsService.getAllSettings();
  }

  @Put()
  async updateSettings (@Body() updateDto: UpdateSettingsDto): Promise<SettingsResponseDto[]> {
    return this.settingsService.updateSettings(updateDto);
  }
}
