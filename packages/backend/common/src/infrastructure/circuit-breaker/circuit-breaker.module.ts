import { CircuitBreakerExplorer } from '../circuit-breaker/circuit-breaker.explorer';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { Module } from '../../core/decorators/module.decorator';

@Module({
  providers: [
    CircuitBreakerService,
    CircuitBreakerExplorer,
    {
      provide: 'CIRCUIT_BREAKER_INITIALIZER',
      useFactory: ((explorer: CircuitBreakerExplorer): (() => void) => {
        return (): void => explorer.explore();
      }) as (...args: unknown[]) => unknown,
      inject: [CircuitBreakerExplorer]
    }
  ],
  exports: [CircuitBreakerService, 'CIRCUIT_BREAKER_INITIALIZER']
})
export class CircuitBreakerModule {}
