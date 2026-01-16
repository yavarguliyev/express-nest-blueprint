import { Container } from '@common/container/container';
import { COMPUTE_METADATA } from '@common/decorators/compute.decorator';
import { Injectable } from '@common/decorators/injectable.decorator';
import { ComputeOptions } from '@common/interfaces/common.interface';
import { ComputeService } from '@core/compute/compute.service';

@Injectable()
export class ComputeExplorer {
  constructor (private readonly computeService: ComputeService) {}

  explore (): void {
    const services = Container.getInstance().getServices();

    for (const [token, entry] of services) {
      if (entry.type !== 'class') continue;

      const instance = Container.getInstance().resolve({ provide: token }) as Record<string, unknown>;
      const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;
      if (!prototype) continue;

      const methods = Object.getOwnPropertyNames(prototype);

      for (const methodName of methods) {
        if (methodName === 'constructor') continue;

        const method = prototype[methodName];

        if (!method || (typeof method !== 'function' && typeof method !== 'object')) continue;
        const options = Reflect.getMetadata(COMPUTE_METADATA, method) as ComputeOptions | undefined;

        if (options) {
          const serviceToken = token;
          const taskName = `${String(token)}.${methodName}`;

          this.computeService.registerHandler(taskName, { serviceToken, methodName, options });
          this.computeService.patchMethod(instance, methodName, taskName, options);
        }
      }
    }
  }
}
