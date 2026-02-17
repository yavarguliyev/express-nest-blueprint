import { BaseDraft } from './draft.interface';

export interface TokenUpdateEvent {
  tokenIds?: string[];
  tokenNames?: string[];
  source: 'theme-editor' | 'database' | 'api';
  timestamp: number;
}

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

export interface TokenDraft extends BaseDraft {
  tokenName: string;
  lightModeValue: string | null;
  darkModeValue: string | null;
  defaultValue: string;
}

export interface ParsedValue {
  number: number;
  unit: string;
}

export interface BaseChangeEvent {
  tokenId: string;
  value: string;
}

export interface ColorChangeEvent extends BaseChangeEvent {
  mode: 'light' | 'dark' | 'default';
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
