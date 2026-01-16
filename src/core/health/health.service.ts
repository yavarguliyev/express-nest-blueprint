import { Injectable } from '@common/decorators/injectable.decorator';
import { ServiceUnavailableException } from '@common/exceptions/http-exceptions';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';
import { ComputeService } from '@core/compute/compute.service';
import { DatabaseService } from '@core/database/database.service';
import { RedisService } from '@core/redis/redis.service';

@Injectable()
export class HealthService {
  constructor (
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly queueManager: QueueManager,
    private readonly computeService: ComputeService
  ) {}

  checkLive () {
    return {
      status: 'up',
      timestamp: new Date().toISOString()
    };
  }

  async checkReady () {
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

  async checkHealth () {
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

  private checkCompute () {
    try {
      return { status: 'up', ...this.computeService.getStatus() };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  private checkDatabase () {
    try {
      const adapter = this.databaseService.getConnection();
      const connected = adapter.isConnected();
      return { status: connected ? 'up' : 'down' };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async checkRedis () {
    try {
      const redis = this.redisService.getClient();
      await redis.ping();
      return { status: 'up', info: { status: redis.status } };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async checkQueues () {
    try {
      const queues = this.queueManager.getAllQueues();
      const health = [];

      for (const [name] of queues) {
        const qHealth = await this.queueManager.getQueueHealth(name);
        health.push(qHealth);
      }

      return { status: 'up', items: health };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }
}
