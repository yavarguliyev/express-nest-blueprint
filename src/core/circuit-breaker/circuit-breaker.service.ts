import { Injectable } from '@common/decorators';
import { Logger } from '@common/logger';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger('CircuitBreaker');
  private states = new Map<string, CircuitBreakerState>();
  private failureCounts = new Map<string, number>();
  private lastFailureTimes = new Map<string, number>();

  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 10000;

  getState (key: string): CircuitBreakerState {
    const state = this.states.get(key) || CircuitBreakerState.CLOSED;

    if (state === CircuitBreakerState.OPEN) {
      const lastFailureTime = this.lastFailureTimes.get(key) || 0;
      if (Date.now() - lastFailureTime > this.recoveryTimeout) {
        this.states.set(key, CircuitBreakerState.HALF_OPEN);
        return CircuitBreakerState.HALF_OPEN;
      }
    }

    return state;
  }

  recordSuccess (key: string): void {
    const state = this.states.get(key);
    if (state === CircuitBreakerState.HALF_OPEN || state === CircuitBreakerState.OPEN) {
      this.logger.log(`Circuit '${key}' recovered. Closing circuit.`);
      this.states.set(key, CircuitBreakerState.CLOSED);
      this.failureCounts.set(key, 0);
    }
  }

  recordFailure (key: string): void {
    const count = (this.failureCounts.get(key) || 0) + 1;
    this.failureCounts.set(key, count);
    this.lastFailureTimes.set(key, Date.now());

    if (count >= this.failureThreshold) {
      this.logger.warn(`Circuit '${key}' reached failure threshold (${this.failureThreshold}). Opening circuit.`);
      this.states.set(key, CircuitBreakerState.OPEN);
    }
  }
}
