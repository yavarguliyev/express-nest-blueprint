import { Container } from '@common/container/container';
import { INJECT_QUEUE_METADATA, QUEUE_MANAGER_TOKEN } from '@common/decorators';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';

export class QueueInjectionHelper {
  static injectQueues (target: object, container: Container): void {
    const queueMetadata = (Reflect.getMetadata(INJECT_QUEUE_METADATA, target) || []) as string[];
    const queueManager = container.resolve<QueueManager>({ provide: QUEUE_MANAGER_TOKEN });

    for (let i = 0; i < queueMetadata.length; i++) {
      const queueName = queueMetadata[i];
      if (queueName) {
        const queue = queueManager.createQueue(queueName);
        Object.defineProperty(target, `queue_${i}`, { value: queue, writable: false, enumerable: false });
      }
    }
  }
}
