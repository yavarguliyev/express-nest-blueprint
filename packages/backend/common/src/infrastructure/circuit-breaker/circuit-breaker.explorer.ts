import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { Container } from '../../core/container/container';
import { CIRCUIT_BREAKER_METADATA } from '../../core/decorators/circuit-breaker.decorator';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { CircuitBreakerState } from '../../domain/enums/common.enum';
import { ServiceUnavailableException } from '../../domain/exceptions/http-exceptions';
import { CircuitBreakerOptions } from '../../domain/interfaces/common.interface';

@Injectable()
export class CircuitBreakerExplorer {
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

    instance[propertyName] = async function (...args: unknown[]): Promise<unknown> {
      const state = circuitBreakerService.getState(circuitKey);

      if (state === CircuitBreakerState.OPEN) throw new ServiceUnavailableException(`Circuit breaker is OPEN for ${circuitKey}`);

      try {
        const result = await originalMethod.apply(this, args);
        circuitBreakerService.recordSuccess(circuitKey);
        return result;
      } catch (error) {
        circuitBreakerService.recordFailure(circuitKey);
        throw error as ServiceUnavailableException;
      }
    };
  }
}
