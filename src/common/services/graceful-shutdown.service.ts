import http from 'http';

import { GracefulShutDownServiceConfig } from '@common/interfaces';
import { RetryHelper, getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { gracefulShutdownConfig } from '@core/config';

export class GracefulShutdownService {
  private readonly logger = new Logger('System');
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
      this.logger.log('Graceful shutdown initiated...');
      
      if (httpServer?.listening) {
        this.logger.log('Closing HTTP server...');
        
        const server = httpServer;

        if ('closeAllConnections' in server && typeof server.closeAllConnections === 'function') {
          (server.closeAllConnections as () => void)();
        }

        if ('closeIdleConnections' in server && typeof server.closeIdleConnections === 'function') {
          (server.closeIdleConnections as () => void)();
        }

        await new Promise<void>((resolve) => {
          server.close((err) => {
            if (err) this.logger.error(`Error closing HTTP server: ${getErrorMessage(err)}`);
            else this.logger.log('HTTP server closed.');
            resolve();
          });
        });
      }

      this.logger.log('Disconnecting services...');
      await this.disconnectServices();
      this.logger.log('All services disconnected.');
      
      shutdownTimer = this.startShutdownTimer();
    } catch (error) {
      this.logger.error(`Error during shutdown: ${getErrorMessage(error)}`);
    } finally {
      if (shutdownTimer) clearTimeout(shutdownTimer);
      this.logger.log('Finalizing shutdown. Exit 0.');
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
