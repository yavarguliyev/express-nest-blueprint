import { Injectable, RepositoryManager } from '@config/libs';

import { UsersRepository } from '@modules/users/users.repository';
import { CssFilesRepository } from '@modules/themes/repositories/css-files.repository';
import { CssTokensRepository } from '@modules/themes/repositories/css-tokens.repository';
import { CssRulesRepository } from '@modules/themes/repositories/css-rules.repository';
import { ThemeVersionsRepository } from '@modules/themes/repositories/theme-versions.repository';
import { TokenUsageRepository } from '@modules/themes/repositories/token-usage.repository';
import { CssGradientsRepository } from '@modules/themes/repositories/css-gradients.repository';
import { CssBackupsRepository } from '@modules/themes/repositories/css-backups.repository';
import { CssAuditLogRepository } from '@modules/themes/repositories/css-audit-log.repository';

@Injectable()
export class RepositoryRegistrar {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly cssFilesRepository: CssFilesRepository,
    private readonly cssTokensRepository: CssTokensRepository,
    private readonly cssRulesRepository: CssRulesRepository,
    private readonly themeVersionsRepository: ThemeVersionsRepository,
    private readonly tokenUsageRepository: TokenUsageRepository,
    private readonly cssGradientsRepository: CssGradientsRepository,
    private readonly cssBackupsRepository: CssBackupsRepository,
    private readonly cssAuditLogRepository: CssAuditLogRepository
  ) {}

  registerAll (repositoryManager: RepositoryManager): void {
    repositoryManager.registerRepository(this.usersRepository, UsersRepository);
    repositoryManager.registerRepository(this.cssFilesRepository, CssFilesRepository);
    repositoryManager.registerRepository(this.cssTokensRepository, CssTokensRepository);
    repositoryManager.registerRepository(this.cssRulesRepository, CssRulesRepository);
    repositoryManager.registerRepository(this.themeVersionsRepository, ThemeVersionsRepository);
    repositoryManager.registerRepository(this.tokenUsageRepository, TokenUsageRepository);
    repositoryManager.registerRepository(this.cssGradientsRepository, CssGradientsRepository);
    repositoryManager.registerRepository(this.cssBackupsRepository, CssBackupsRepository);
    repositoryManager.registerRepository(this.cssAuditLogRepository, CssAuditLogRepository);
  }
}
