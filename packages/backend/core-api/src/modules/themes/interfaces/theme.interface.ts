import { WithIsActive } from '@config/libs';

import { BaseEntity, CssActionType, CssEntityType, CssGradientType, CssStatusType, Describable } from '@modules/themes/types/theme.type';

export interface CssAuditLogEntity extends BaseEntity {
  entityType: CssEntityType;
  entityId: string;
  action: CssActionType;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  changedBy: string | null;
  changeReason: string | null;
}

export interface CssBackupEntity extends BaseEntity, Describable {
  backupName: string;
  backupDate: Date;
  totalFiles: number;
  location: string | null;
  purpose: string | null;
  notes: string | null;
}

export interface CssFileEntity extends BaseEntity, Describable {
  fileName: string;
  filePath: string;
  isEmpty: boolean;
  fileSize: number;
  category: string | null;
}

export interface CssGradientEntity extends BaseEntity, Describable {
  gradientName: string;
  gradientValue: string;
  gradientType: CssGradientType;
  isSystemGradient: boolean;
}

export interface CssRuleEntity extends BaseEntity {
  fileId: string;
  selector: string;
  properties: Record<string, unknown>;
  ruleOrder: number;
  isImportant: boolean;
  appliesToTheme: string | null;
  lineNumber: number | null;
}

export interface CssTokenEntity extends BaseEntity, Describable {
  tokenName: string;
  tokenCategory: string;
  tokenType: string;
  defaultValue: string;
  lightModeValue: string | null;
  darkModeValue: string | null;
  isCustomizable: boolean;
}

export interface ThemeVersionEntity extends BaseEntity, Describable, WithIsActive {
  versionName: string;
  versionNumber: number;
  status: CssStatusType;
  tokenOverrides: Record<string, unknown> | null;
  createdBy: string | null;
  publishedAt: Date | null;
}

export interface TokenUsageEntity extends BaseEntity {
  tokenId: string;
  ruleId: string;
  propertyName: string;
  usageContext: string | null;
}

export interface AuditLogQuery {
  entityId?: string;
  entityType?: CssEntityType;
  changedBy?: string;
  limit?: number;
}
