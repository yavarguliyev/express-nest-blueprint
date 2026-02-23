import { Auditable, DatabaseAdapter, WithId, WithNullableDescription } from '@config/libs';

export type CssEntityType = 'token' | 'rule' | 'theme' | 'file';

export type CssGradientType = 'linear' | 'radial' | 'conic';

export type CssStatusType = 'draft' | 'published' | 'archived';

export type CssActionType = 'create' | 'update' | 'delete' | 'publish';

export type ConnectionParams<T extends object> = T & { connection?: DatabaseAdapter };

export type Describable = WithNullableDescription;

export type EntityIdParams = ConnectionParams<{ entityId: string }>;
export type EntityTypeParams = ConnectionParams<{ entityType: CssEntityType }>;
export type ChangedByParams = ConnectionParams<{ changedBy: string }>;
export type RecentActivityParams = ConnectionParams<{ limit?: number }>;
export type BackupNameParams = ConnectionParams<{ backupName: string }>;
export type RecentBackupsParams = ConnectionParams<{ limit?: number }>;
export type FilePathParams = ConnectionParams<{ filePath: string }>;
export type CategoryParams = ConnectionParams<{ category: string }>;
export type GradientNameParams = ConnectionParams<{ gradientName: string }>;
export type GradientTypeParams = ConnectionParams<{ gradientType: CssGradientType }>;
export type FileIdParams = ConnectionParams<{ fileId: string }>;
export type SelectorParams = ConnectionParams<{ selector: string }>;
export type ThemeParams = ConnectionParams<{ appliesToTheme: string }>;
export type TokenNameParams = ConnectionParams<{ tokenName: string }>;
export type TokenCategoryParams = ConnectionParams<{ tokenCategory: string }>;
export type TokenTypeParams = ConnectionParams<{ tokenType: string }>;
export type TokenIdParams = ConnectionParams<{ tokenId: string }>;
export type RuleIdParams = ConnectionParams<{ ruleId: string }>;
export type PropertyNameParams = ConnectionParams<{ propertyName: string }>;
export type TokenUsageByRuleParams = ConnectionParams<{ tokenId: string; ruleId: string; propertyName: string }>;
export type VersionNumberParams = ConnectionParams<{ versionNumber: number }>;
export type ThemeStatusParams = ConnectionParams<{ status: 'draft' | 'published' | 'archived' }>;
export type BaseEntity = WithId<string> & Auditable<Date>;
