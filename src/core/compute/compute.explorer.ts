import { Container } from '@common/container';
import { Injectable, COMPUTE_METADATA } from '@common/decorators';
import { ComputeOptions } from '@common/interfaces';
import { Constructor, PatchedMethod } from '@common/types';
import { ComputeService } from '@core/compute/compute.service';

@Injectable()
export class ComputeExplorer {
  constructor (private readonly computeService: ComputeService) {}

  public explore (): void {
    const container = Container.getInstance();
    const services = container.getServices();

    services.forEach((entry, token) => {
      if (entry.type === 'class' && entry.target) this.scanForComputeMethods(entry.target, token);  
      else if (entry.type === 'value' && entry.value && typeof entry.value === 'object') {
        const value = entry.value;
        if (value.constructor) this.scanForComputeMethods(value.constructor as Constructor, token);
      } else if (entry.type === 'factory' && typeof token === 'function') this.scanForComputeMethods(token, token);
    });
  }

  private scanForComputeMethods (target: Constructor, token: unknown): void {
    const prototype = target.prototype as Record<string, unknown>;
    if (!prototype) return;

    Object.getOwnPropertyNames(prototype).forEach((methodName) => {
      if (methodName === 'constructor') return;
      const method = prototype[methodName];

      if (!method || (typeof method !== 'function' && typeof method !== 'object')) return;
      const options = Reflect.getMetadata(COMPUTE_METADATA, method) as ComputeOptions | undefined;

      if (options) {
        const serviceToken = token as Constructor | string | symbol;
        this.computeService.registerHandler({ serviceToken, methodName, options });

        const originalMethod = method as (...args: unknown[]) => Promise<unknown>;
        const computeService = this.computeService;

        prototype[methodName] = async (...args: unknown[]): Promise<unknown> => computeService.offload(token, methodName, args);
        const patchedMethod = prototype[methodName] as PatchedMethod;
        patchedMethod.__original__ = originalMethod;
      }
    });
  }
}
