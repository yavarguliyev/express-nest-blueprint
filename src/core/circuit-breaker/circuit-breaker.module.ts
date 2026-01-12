import { Module } from '@common/decorators';
import { CircuitBreakerService } from '@core/circuit-breaker/circuit-breaker.service';
import { CircuitBreakerExplorer } from '@core/circuit-breaker/circuit-breaker.explorer';

@Module({
  providers: [
    CircuitBreakerService,
    CircuitBreakerExplorer,
    {
      provide: 'CIRCUIT_BREAKER_INITIALIZER',
      useFactory: ((explorer: CircuitBreakerExplorer) => () => explorer.explore()) as (...args: unknown[]) => unknown,
      inject: [CircuitBreakerExplorer]
    }
  ],
  exports: [CircuitBreakerService, 'CIRCUIT_BREAKER_INITIALIZER']
})
export class CircuitBreakerModule {}
