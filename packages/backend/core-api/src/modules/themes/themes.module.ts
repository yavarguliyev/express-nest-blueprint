import { Module } from '@config/libs';

import { CssFilesRepository } from '@modules/themes/repositories/css-files.repository';
import { CssTokensRepository } from '@modules/themes/repositories/css-tokens.repository';
import { CssRulesRepository } from '@modules/themes/repositories/css-rules.repository';
import { ThemeVersionsRepository } from '@modules/themes/repositories/theme-versions.repository';
import { TokenUsageRepository } from '@modules/themes/repositories/token-usage.repository';
import { CssGradientsRepository } from '@modules/themes/repositories/css-gradients.repository';
import { CssBackupsRepository } from '@modules/themes/repositories/css-backups.repository';
import { CssAuditLogRepository } from '@modules/themes/repositories/css-audit-log.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [CssFilesRepository, CssTokensRepository, CssRulesRepository, ThemeVersionsRepository, TokenUsageRepository, CssGradientsRepository, CssBackupsRepository, CssAuditLogRepository],
  exports: [CssFilesRepository, CssTokensRepository, CssRulesRepository, ThemeVersionsRepository, TokenUsageRepository, CssGradientsRepository, CssBackupsRepository, CssAuditLogRepository]
})
export class ThemesModule {}
