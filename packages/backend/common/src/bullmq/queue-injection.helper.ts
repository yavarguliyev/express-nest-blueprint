import { QueueManager } from './services/queue-manager.service';
import { Container } from '../container/container';
import { INJECT_QUEUE_METADATA, QUEUE_MANAGER_TOKEN } from '../decorators/bullmq.decorators';

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
