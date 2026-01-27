import http from 'http';

import { RetryHelper } from '../../domain/helpers/retry.helper';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { GracefulShutDownServiceConfig } from '../../domain/interfaces/common.interface';
import { Logger } from '../../infrastructure/logger/logger.service';

export class GracefulShutdownService {
  private readonly logger = new Logger(GracefulShutdownService.name);
  private readonly services: GracefulShutDownServiceConfig[];

  private readonly shutdownTimeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor (services: GracefulShutDownServiceConfig[], config?: { shutdownTimeout: number; maxRetries: number; retryDelay: number }) {
    this.services = services;
    this.shutdownTimeout = config?.shutdownTimeout || 3000;
    this.maxRetries = config?.maxRetries || 3;
    this.retryDelay = config?.retryDelay || 1000;
  }

  public async shutDown (httpServer?: http.Server): Promise<void> {
    const shutdownTimer = setTimeout(() => {
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      this.logger.log('Graceful shutdown initiated...');

      if (httpServer?.listening) {
        if ('closeAllConnections' in httpServer && typeof httpServer.closeAllConnections === 'function') {
          (httpServer.closeAllConnections as () => void)();
        }

        if ('closeIdleConnections' in httpServer && typeof httpServer.closeIdleConnections === 'function') {
          (httpServer.closeIdleConnections as () => void)();
        }

        await new Promise<void>(resolve => {
          httpServer.close(err => {
            if (err) this.logger.error(`Error closing HTTP server: ${getErrorMessage(err)}`);
            else this.logger.log('HTTP server closed.');
            resolve();
          });
        });
      }

      await this.disconnectServices();
      this.logger.log('All services disconnected.');
    } catch (error) {
      this.logger.error(`Error during shutdown: ${getErrorMessage(error)}`);
    } finally {
      clearTimeout(shutdownTimer);
      process.exit(0);
    }
  }

  private async disconnectServices (): Promise<void> {
    const serviceTimeout = 2000;

    const disconnectPromises = this.services.map(async service => {
      const disconnectPromise = this.retryDisconnect(service);
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout disconnecting ${service.name} after ${serviceTimeout}ms`)), serviceTimeout);
      });

      return Promise.race([disconnectPromise, timeoutPromise]).catch(error => {
        this.logger.error(`Failed to disconnect ${service.name}: ${getErrorMessage(error)}`);
      });
    });

    await Promise.all(disconnectPromises);
  }

  private async retryDisconnect (service: GracefulShutDownServiceConfig): Promise<void> {
    await RetryHelper.executeWithRetry(service.disconnect, {
      serviceName: service.name,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      onRetry: attempt => this.logger.log(`Retrying ${service.name} disconnect, attempt ${attempt}`)
    });
  }
}
