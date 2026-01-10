import http from 'http';

import { GracefulShutDownServiceConfig } from '@common/interfaces';
import { RetryHelper, getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { gracefulShutdownConfig } from '@core/config';

export class GracefulShutdownService {
  private readonly logger = new Logger('RetryHelper');
  private readonly services: GracefulShutDownServiceConfig[];

  private readonly shutdownTimeout = gracefulShutdownConfig.SHUT_DOWN_TIMER;
  private readonly maxRetries = gracefulShutdownConfig.SHUTDOWN_RETRIES;
  private readonly retryDelay = gracefulShutdownConfig.SHUTDOWN_RETRY_DELAY;

  constructor (services: GracefulShutDownServiceConfig[]) {
    this.services = services;
  }

  public async shutDown (httpServer?: http.Server): Promise<void> {
    let shutdownTimer;

    try {
      if (httpServer?.listening) await new Promise<void>((resolve, reject) => httpServer.close((err) => (err ? reject(err) : resolve())));
      await this.disconnectServices();
      shutdownTimer = this.startShutdownTimer();
    } catch (error) {
      this.logger.log(`Error during shutdown: ${getErrorMessage(error)}`, 'error');
    } finally {
      if (shutdownTimer) clearTimeout(shutdownTimer);
      process.exit(0);
    }
  }

  private async disconnectServices (): Promise<void> {
    const disconnectPromises = this.services.map((service) =>
      this.retryDisconnect(service).catch((error) => {
        throw error;
      })
    );
    await Promise.all(disconnectPromises);
  }

  private async retryDisconnect (service: GracefulShutDownServiceConfig): Promise<void> {
    await RetryHelper.executeWithRetry(service.disconnect, {
      serviceName: service.name,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      onRetry: (attempt) => this.logger.log(`Retrying ${service.name} disconnect, attempt ${attempt}`)
    });
  }

  private startShutdownTimer () {
    return setTimeout(() => {
      process.exit(1);
    }, this.shutdownTimeout);
  }
}
