import { StorageUrlOptions } from '../../domain/interfaces/storage.interface';

export abstract class StorageService {
  abstract upload(key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void>;
  abstract getDownloadUrl(key: string, options?: StorageUrlOptions): Promise<string>;
  abstract delete(key: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
}
