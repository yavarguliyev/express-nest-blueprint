import { Module } from '@config/libs';

import { SettingsController } from '@modules/settings/settings.controller';
import { SettingsRepository } from '@modules/settings/settings.repository';
import { SettingsService } from '@modules/settings/settings.service';

@Module({
  imports: [],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService]
})
export class SettingsModule {}