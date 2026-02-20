import { ROUTE_METADATA } from '../../decorators/route.decorators';
import { PARAM_METADATA } from '../../decorators/param.decorators';
import { RouteMetadata, ParamMetadata } from '../../../domain/interfaces/nest/nest-core.interface';
import { Constructor } from '../../../domain/types/common/util.type';
import { RouteInfoOpts } from '../../../domain/interfaces/api/api.interface';

export class RouteExplorer {
  exploreRoutes (prototype: object, methodName: string): RouteInfoOpts[] {
    const routes = this.getRouteMetadata(prototype, methodName);
    const params = this.getParamMetadata(prototype, methodName);
    const paramTypes = this.getParamTypes(prototype, methodName);

    return routes.map(route => ({
      route,
      params,
      paramTypes,
      methodName
    }));
  }

  normalizePath (base: string, path: string): string {
    const combined = `/${base}/${path}`.replace(/\/+/g, '/');
    const result = combined.length > 1 && combined.endsWith('/') ? combined.slice(0, -1) : combined;
    return result.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
  }

  humanize (str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }

  private getRouteMetadata (prototype: object, methodName: string): RouteMetadata[] {
    return (Reflect.getMetadata(ROUTE_METADATA, prototype, methodName) || []) as RouteMetadata[];
  }

  private getParamMetadata (prototype: object, methodName: string): ParamMetadata[] {
    return (Reflect.getMetadata(PARAM_METADATA, prototype, methodName) || []) as ParamMetadata[];
  }

  private getParamTypes (prototype: object, methodName: string): Constructor[] {
    return (Reflect.getMetadata('design:paramtypes', prototype, methodName) || []) as Constructor[];
  }
}
