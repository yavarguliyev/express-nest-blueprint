import { QueueManager } from '../bullmq/services/queue-manager.service';
import { ComputeService } from '../compute/compute.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { ServiceUnavailableException } from '../../domain/exceptions/http-exceptions';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { KafkaService } from '../kafka/kafka.service';
import { StorageService } from '../storage/storage.service';
import {
  LiveCheckResult,
  ReadyCheckResult,
  HealthCheckResult,
  ComputeStatus,
  RedisStatus,
  QueueStatus
} from '../../domain/interfaces/health/health-check.interface';
import { DatabaseStatus, KafkaStatus, StorageStatus } from '../../domain/types/health/health-status.type';

@Injectable()
export class HealthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly queueManager: QueueManager,
    private readonly computeService: ComputeService,
    private readonly kafkaService: KafkaService,
    private readonly storageService: StorageService
  ) {}

  checkLive = (): LiveCheckResult => ({ status: 'up', timestamp: new Date().toISOString() });

  async checkReady(): Promise<ReadyCheckResult> {
    const dbStatus = this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const kafkaStatus = await this.checkKafka();

    const isHealthy = dbStatus.status === 'up' && redisStatus.status === 'up' && kafkaStatus.status === 'up';
    if (!isHealthy) throw new ServiceUnavailableException('Service not ready: Database, Redis or Kafka is down');

    return {
      status: 'up',
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        redis: redisStatus,
        kafka: kafkaStatus
      }
    };
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const dbStatus = this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const queueStatus = await this.checkQueues();
    const computeStatus = this.checkCompute();
    const kafkaStatus = await this.checkKafka();
    const storageStatus = await this.checkStorage();

    const isHealthy = dbStatus.status === 'up' && redisStatus.status === 'up' && kafkaStatus.status === 'up' && storageStatus.status === 'up';

    return {
      status: isHealthy ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        redis: redisStatus,
        queues: queueStatus,
        'compute workers': computeStatus,
        kafka: kafkaStatus,
        storage: storageStatus
      }
    };
  }

  private checkCompute(): ComputeStatus {
    try {
      return { status: 'up', ...this.computeService.getStatus() };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private checkDatabase(): DatabaseStatus {
    try {
      const adapter = this.databaseService.getConnection();
      const connected = adapter.isConnected();
      return { status: connected ? 'up' : 'down' };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private async checkRedis(): Promise<RedisStatus> {
    try {
      const redis = this.redisService.getClient();
      await redis.ping();
      return { status: 'up', info: { status: redis.status } };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private async checkQueues(): Promise<QueueStatus> {
    try {
      const queues = this.queueManager.getAllQueues();
      const health = [];

      for (const [name] of queues) {
        const qHealth = await this.queueManager.getQueueHealth(name);
        health.push(qHealth);
      }

      return { status: 'up', items: health };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private async checkKafka(): Promise<KafkaStatus> {
    try {
      await this.kafkaService.connect();
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private async checkStorage(): Promise<StorageStatus> {
    try {
      await this.storageService.exists('.health-check');
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }
}
