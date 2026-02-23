import { ClassConstructor } from 'class-transformer';
import { Request, Response, NextFunction, RequestHandler } from 'express';

import { Container } from '../../core/container/container';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { GUARDS_METADATA } from '../../core/decorators/middleware.decorators';
import { PARAM_METADATA } from '../../core/decorators/param.decorators';
import { BadRequestException, UnauthorizedException } from '../../domain/exceptions/http-exceptions';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { CanActivate } from '../../domain/interfaces/nest/guard.interface';
import { ControllerExecutionContext, ControllerInvocationContext, ParamMetadata } from '../../domain/interfaces/nest/nest-core.interface';
import { ExtractMethodOptions } from '../../domain/interfaces/common/util.interface';
import { Constructor } from '../../domain/types/common/util.type';
import { paramHandlers } from '../../domain/constants/nest/nest.const';

export class RequestHandlerFactory {
  constructor (private container: Container) {}

  createRequestHandler<T extends object> (controllerClass: Constructor<T>, instance: T, methodName: string): RequestHandler {
    const originalMethod = this.extractMethod({ instance, methodName: methodName as keyof T }) as (...args: unknown[]) => Promise<unknown>;
    const paramMetadata = (Reflect.getMetadata(PARAM_METADATA as symbol, controllerClass.prototype as object, methodName) || []) as ParamMetadata[];

    return (req: Request, res: Response, next: NextFunction) => {
      void (async (): Promise<void> => {
        try {
          await this.runGuards({ req, res, controllerClass, methodName, method: originalMethod });
          const args = await this.resolveArguments({ req, res, next, controllerClass, methodName, paramMetadata });
          const result = await originalMethod.apply(instance, args);
          this.handleResponse(res, result, paramMetadata);
        } catch (err) {
          next(err);
        }
      })();
    };
  }

  private async runGuards<T extends object> (opts: ControllerInvocationContext<T>): Promise<void> {
    const { req, res, controllerClass, methodName, method } = opts;

    const classGuards = (Reflect.getMetadata(GUARDS_METADATA, controllerClass) || []) as Constructor<CanActivate>[];
    const methodGuards = (Reflect.getMetadata(GUARDS_METADATA, controllerClass.prototype as object, methodName) || []) as Constructor<CanActivate>[];
    const guards = [AuthGuard, RolesGuard, ...classGuards, ...methodGuards];

    for (const GuardClass of guards) {
      const guard = this.container.resolve<CanActivate>({ provide: GuardClass });
      await new Promise<void>((resolve, reject) => {
        void guard.canActivate(
          req,
          res,
          (err?: Error | string) => (err ? reject(new UnauthorizedException(String(getErrorMessage(err)))) : resolve()),
          method,
          controllerClass
        );
      });
    }
  }

  private async resolveArguments<T extends object> (opts: ControllerExecutionContext<T>): Promise<unknown[]> {
    const { req, res, next, controllerClass, methodName, paramMetadata } = opts;

    const args: unknown[] = [];
    const paramTypes = (Reflect.getMetadata('design:paramtypes', controllerClass.prototype as object, methodName) ||
      []) as ClassConstructor<object>[];

    for (const param of paramMetadata.sort((a, b) => a.index - b.index)) {
      const handler = paramHandlers[param.type];
      if (handler) await handler(param, param.index, args, paramTypes, req, res, next);
    }

    return args;
  }

  private handleResponse (res: Response, result: unknown, paramMetadata: ParamMetadata[]): void {
    if (res.headersSent) return;

    const isPassthrough = paramMetadata.some(
      p => p.type === 'response' && typeof p.data === 'object' && p.data !== null && (p.data as { passthrough?: boolean }).passthrough
    );

    if (isPassthrough) {
      if (result !== undefined) res.send(result);
      return;
    }

    res.json({ success: true, data: result, message: 'Operation completed successfully' });
  }

  private extractMethod<T extends object, K extends keyof T> ({ instance, methodName }: ExtractMethodOptions<T, K>): (...args: unknown[]) => unknown {
    const method = instance[methodName];
    if (typeof method !== 'function') throw new BadRequestException(`Method ${String(methodName)} is not a function`);
    return method as (...args: unknown[]) => unknown;
  }
}
