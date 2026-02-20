export interface CssToken {
  id: string;
  tokenName: string;
  tokenCategory: string;
  tokenType: string;
  defaultValue: string;
  lightModeValue: string | null;
  darkModeValue: string | null;
  description: string | null;
  isCustomizable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenDraft {
  id: string;
  tokenName: string;
  lightModeValue: string | null;
  darkModeValue: string | null;
  defaultValue: string;
  hasChanges: boolean;
}

export interface TokenUpdateEvent {
  tokenIds?: string[];
  tokenNames?: string[];
  source: 'theme-editor' | 'database' | 'api';
  timestamp: number;
}

export interface TokenRelationship {
  baseToken: string;
  relatedTokens: string[];
  generator: (baseValue: string) => string;
}

export interface ParsedValue {
  number: number;
  unit: string;
}

export interface ColorChangeEvent {
  tokenId: string;
  value: string;
  mode: 'light' | 'dark' | 'default';
}

export interface FontChangeEvent {
  tokenId: string;
  value: string;
}

export interface SpacingChangeEvent {
  tokenId: string;
  value: string;
}

export interface ActionButtonConfig {
  show: boolean;
  disabled?: boolean;
  tooltip?: string;
}

export interface DraftStatusConfig {
  draftCount: number;
  hasDrafts: boolean;
  affectedItems?: string[];
  isProcessing: boolean;
  itemType?: 'table' | 'token' | 'item';
  resetButtonText?: string;
  saveButtonText?: string;
  resetButtonIcon?: string;
  saveButtonIcon?: string;
}

export interface FontOption {
  name: string;
  value: string;
}

export interface FontGroup {
  category: string;
  fonts: FontOption[];
}
