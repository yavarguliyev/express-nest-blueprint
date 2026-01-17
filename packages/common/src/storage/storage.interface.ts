export interface StorageModuleOptions {
  strategy: 's3' | 'local';
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
