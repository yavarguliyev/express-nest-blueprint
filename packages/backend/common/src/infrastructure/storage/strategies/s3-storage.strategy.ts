import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  S3ClientConfig,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { StorageService } from '../storage.service';
import { STORAGE_OPTIONS } from '../../../core/decorators/bullmq.decorators';
import { Injectable, Inject } from '../../../core/decorators/injectable.decorator';
import { BadRequestException } from '../../../domain/exceptions/http-exceptions';
import { StorageModuleOptions, StorageUrlOptions } from '../../../domain/interfaces/infra/storage.interface';

@Injectable()
export class S3StorageStrategy extends StorageService {
  private readonly client: S3Client;
  private readonly urlClient: S3Client;
  private readonly bucketName: string;
  private readonly ensureBucketEnabled: boolean;
  private bucketEnsured = false;

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

    const urlConfig: S3ClientConfig = { ...config };
    if (options.s3.publicEndpoint) urlConfig.endpoint = options.s3.publicEndpoint;
    this.urlClient = new S3Client(urlConfig);

    this.bucketName = options.s3.bucketName;
    this.ensureBucketEnabled = options.s3.ensureBucket ?? true;
  }

  private async ensureBucket (): Promise<void> {
    if (this.bucketEnsured || !this.ensureBucketEnabled) return;

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucketName })).catch(() => {});
    }

    this.bucketEnsured = true;
  }

  override async upload (key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void> {
    await this.ensureBucket();

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
    const url = await getSignedUrl(this.urlClient, command, { expiresIn: options?.expiresIn ?? 3600 });
    return url;
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

  override async getTotalUsage (): Promise<number> {
    try {
      let totalSize = 0;
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucketName,
          ContinuationToken: continuationToken
        });

        const response = await this.client.send(command);

        if (response.Contents) {
          totalSize += response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return totalSize;
    } catch {
      return 0;
    }
  }
}
