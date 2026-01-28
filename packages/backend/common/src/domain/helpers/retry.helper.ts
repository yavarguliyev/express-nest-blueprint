import { BadRequestException } from '../exceptions/http-exceptions';
import { getErrorMessage } from '../helpers/utility-functions.helper';
import { RetryOptions } from '../interfaces/common.interface';
import { Logger } from '../../infrastructure/logger/logger.service';

export class RetryHelper {
  private static logger = new Logger(RetryHelper.name);

  static async executeWithRetry<T> (fn: () => Promise<T>, { serviceName, maxRetries, retryDelay, onRetry }: RetryOptions): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const retryingMessage = `${serviceName} shutdown failed, retrying... (${attempt}/${maxRetries})`;
        const finalFailureMessage = `${serviceName} shutdown failed after ${maxRetries} attempts: ${getErrorMessage(error)}`;
        const logMessage = attempt < maxRetries ? retryingMessage : finalFailureMessage;

        void this.logger.log(logMessage, 'error');

        if (attempt === maxRetries) throw error;
        if (onRetry) onRetry(attempt);

        void this.logger.log(`Waiting ${retryDelay}ms before retry...`, 'info');
        await this.delay(retryDelay);
      }
    }

    throw new BadRequestException(`Exceeded maximum retries for ${serviceName}`);
  }

  private static delay (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
