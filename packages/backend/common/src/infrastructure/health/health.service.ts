import { QueueManager } from '../bullmq/services/queue-manager.service';
import { ComputeService } from '../compute/compute.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { ServiceUnavailableException } from '../../domain/exceptions/http-exceptions';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import {
  LiveCheckResult,
  ReadyCheckResult,
  HealthCheckResult,
  ComputeStatus,
  DatabaseStatus,
  RedisStatus,
  QueueStatus
} from '../../domain/interfaces/common.interface';

@Injectable()
export class HealthService {
  constructor (
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly queueManager: QueueManager,
    private readonly computeService: ComputeService
  ) {}

  checkLive (): LiveCheckResult {
    return {
      status: 'up',
      timestamp: new Date().toISOString()
    };
  }

  async checkReady (): Promise<ReadyCheckResult> {
    const dbStatus = this.checkDatabase();
    const redisStatus = await this.checkRedis();

    const isHealthy = dbStatus.status === 'up' && redisStatus.status === 'up';

    if (!isHealthy) {
      throw new ServiceUnavailableException('Service not ready: Database or Redis is down');
    }

    return {
      status: 'up',
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        redis: redisStatus
      }
    };
  }

  async checkHealth (): Promise<HealthCheckResult> {
    const dbStatus = this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const queueStatus = await this.checkQueues();
    const computeStatus = this.checkCompute();

    const isHealthy = dbStatus.status === 'up' && redisStatus.status === 'up';

    return {
      status: isHealthy ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        redis: redisStatus,
        queues: queueStatus,
        compute: computeStatus
      }
    };
  }

  private checkCompute (): ComputeStatus {
    try {
      return { status: 'up', ...this.computeService.getStatus() };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private checkDatabase (): DatabaseStatus {
    try {
      const adapter = this.databaseService.getConnection();
      const connected = adapter.isConnected();
      return { status: connected ? 'up' : 'down' };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private async checkRedis (): Promise<RedisStatus> {
    try {
      const redis = this.redisService.getClient();
      await redis.ping();
      return { status: 'up', info: { status: redis.status } };
    } catch (error) {
      return { status: 'down', error: getErrorMessage(error) };
    }
  }

  private async checkQueues (): Promise<QueueStatus> {
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
}
