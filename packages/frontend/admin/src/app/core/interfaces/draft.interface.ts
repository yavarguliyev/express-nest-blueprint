export interface BaseDraft {
  id: string;
  hasChanges: boolean;
  timestamp: Date;
}

export interface DraftStorageMetadata {
  totalChanges: number;
  lastModified: Date;
}

export interface BaseDraftStorage<T extends BaseDraft> {
  version: string;
  timestamp: Date;
  drafts: Record<string, T>;
  metadata: DraftStorageMetadata;
}

export interface PublishResult {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
