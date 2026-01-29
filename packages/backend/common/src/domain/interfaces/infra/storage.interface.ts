import { StorageStrategy } from '../../types/infra/storage.type';

export interface StorageModuleOptions {
  strategy: StorageStrategy;
  s3?: {
    endpoint?: string | undefined;
    publicEndpoint?: string | undefined;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
    forcePathStyle?: boolean | undefined;
  };
}

export interface StorageUrlOptions {
  expiresIn?: number;
}
