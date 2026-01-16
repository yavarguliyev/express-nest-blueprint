import { Container } from '@common/container/container';
import { Injectable } from '@common/decorators/injectable.decorator';
import { CIRCUIT_BREAKER_METADATA } from '@common/decorators/circuit-breaker.decorator';
import { CircuitBreakerState } from '@common/enums/common.enum';
import { ServiceUnavailableException } from '@common/exceptions/http-exceptions';
import { CircuitBreakerOptions } from '@common/interfaces/common.interface';
import { Logger } from '@common/logger/logger.service';
import { CircuitBreakerService } from '@core/circuit-breaker/circuit-breaker.service';

@Injectable()
export class CircuitBreakerExplorer {
  private readonly logger = new Logger(CircuitBreakerExplorer.name);

  constructor (private readonly circuitBreakerService: CircuitBreakerService) {}

  explore (): void {
    const services = Container.getInstance().getServices();

    for (const [token, entry] of services) {
      if (entry.type !== 'class') continue;

      const instance = Container.getInstance().resolve({ provide: token }) as Record<string, unknown>;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;
      if (!prototype) continue;

      const propertyNames = Object.getOwnPropertyNames(prototype);

      for (const propertyName of propertyNames) {
        if (propertyName === 'constructor') continue;

        const options = Reflect.getMetadata(CIRCUIT_BREAKER_METADATA, prototype, propertyName) as CircuitBreakerOptions | undefined;

        if (options) {
          this.patchMethod(instance, propertyName, options);
        }
      }
    }
  }

  private patchMethod (instance: Record<string, unknown>, propertyName: string, options: CircuitBreakerOptions): void {
    const originalMethod = instance[propertyName] as (...args: unknown[]) => Promise<unknown>;
    const circuitKey = options.key || `${instance.constructor.name}.${propertyName}`;
    const circuitBreakerService = this.circuitBreakerService;

    this.logger.log(`Patching ${instance.constructor.name}.${propertyName} with Circuit Breaker (Key: ${circuitKey})`);

    instance[propertyName] = async function (...args: unknown[]): Promise<unknown> {
      const state = circuitBreakerService.getState(circuitKey);

      if (state === CircuitBreakerState.OPEN) {
        throw new ServiceUnavailableException(`Circuit breaker is OPEN for ${circuitKey}`);
      }

      try {
        const result = await originalMethod.apply(this, args);
        circuitBreakerService.recordSuccess(circuitKey);
        return result;
      } catch (error) {
        circuitBreakerService.recordFailure(circuitKey);
        throw error as Error;
      }
    };
  }
}
