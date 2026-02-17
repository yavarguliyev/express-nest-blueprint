export interface BaseDraft {
  id: string;
  timestamp: Date;
  hasChanges: boolean;
}

export interface DraftStorage<T extends BaseDraft> {
  version: string;
  timestamp: Date;
  drafts: Record<string, T>;
  metadata: DraftMetadata;
}

export interface DraftMetadata {
  totalChanges: number;
  lastModified: Date;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface StorageOptions {
  version: string;
  migrate?: (oldData: unknown, oldVersion: string) => unknown;
}
