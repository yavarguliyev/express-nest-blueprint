import { IS_PUBLIC_KEY, REQUIRE_AUTH_KEY } from '../../../core/decorators/auth.decorator';
import { CONTROLLER_METADATA } from '../../../core/decorators/controller.decorator';
import { CONTROLLER_REGISTRY } from '../../../core/decorators/register-controller-class.decorator';
import { ControllerInfo } from '../../../domain/interfaces/api/api.interface';
import { Constructor } from '../../../domain/types/common/util.type';

export class ControllerExplorer {
  exploreControllers (): ControllerInfo[] {
    const controllers: ControllerInfo[] = [];

    CONTROLLER_REGISTRY.forEach((controller: Constructor) => {
      const info = this.extractControllerInfo(controller);
      controllers.push(info);
    });

    return controllers;
  }

  private extractControllerInfo (controller: Constructor): ControllerInfo {
    const controllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA, controller) as { path: string };
    const basePath = controllerMetadata?.path || '';
    const requiresAuth = Reflect.getMetadata(REQUIRE_AUTH_KEY, controller) as boolean;
    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller) as boolean;
    const prototype = controller.prototype as object;
    const methods = Object.getOwnPropertyNames(prototype).filter(m => m !== 'constructor');

    return {
      controller,
      basePath,
      requiresAuth,
      isPublic,
      methods
    };
  }
}
