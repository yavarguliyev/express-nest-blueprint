import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { Injectable, Inject, STORAGE_OPTIONS } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { StorageModuleOptions, StorageUrlOptions } from '@core/storage/storage.interface';
import { StorageService } from '@core/storage/storage.service';

@Injectable()
export class S3StorageStrategy extends StorageService {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor (@Inject(STORAGE_OPTIONS) options: StorageModuleOptions) {
    super();
    if (!options.s3) throw new BadRequestException('S3 configuration is missing');

    const config: S3ClientConfig = {
      region: options.s3.region,
      credentials: {
        accessKeyId: options.s3.accessKeyId,
        secretAccessKey: options.s3.secretAccessKey
      },
      forcePathStyle: options.s3.forcePathStyle ?? false
    };

    if (options.s3.endpoint) config.endpoint = options.s3.endpoint;

    this.client = new S3Client(config);
    this.bucketName = options.s3.bucketName;
  }

  override async upload (key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType
    });

    await this.client.send(command);
  }

  override async getDownloadUrl (key: string, options?: StorageUrlOptions): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: options?.expiresIn ?? 3600 });
  }

  override async delete (key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucketName, Key: key });
    await this.client.send(command);
  }

  override async exists (key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({ Bucket: this.bucketName, Key: key });
      await this.client.send(command);
      return true;
    } catch (error: unknown) {
      const err = error as { name: string };
      if (err.name === 'NotFound' || err.name === 'NoSuchKey') return false;
      throw error;
    }
  }
}
