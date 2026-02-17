export interface KeyValue<T = unknown> {
  key: string;
  value: T;
}

export interface Entity {
  id: number | string;
}

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}

export interface BatchResult {
  success: number;
  failed: number;
  total: number;
  errors?: Array<{ id: string | number; error: string }>;
}

export interface PublishResult extends BatchResult {
  publishedIds: Array<string | number>;
}
