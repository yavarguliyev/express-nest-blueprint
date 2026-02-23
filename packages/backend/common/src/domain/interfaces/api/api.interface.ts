import { Constructor } from '../../types/common/util.type';
import { OptionalVersioned, Prefixed, RequiresAuth, Versioned, WithPath } from '../common/base.interface';
import { ParamMetadata, RouteMetadata } from '../nest/nest-core.interface';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface ApiVersionConfig extends Prefixed, Versioned {}

export interface BaseControllerOptions extends WithPath, Prefixed, OptionalVersioned {}

export interface CorsOptions {
  allowedHeaders?: string;
  methods?: string;
  origin?: string;
}

export interface ControllerInfo extends RequiresAuth {
  controller: Constructor;
  basePath: string;
  isPublic: boolean;
  methods: string[];
}

export interface SecurityMetadata extends RequiresAuth {
  roles: string[] | undefined;
  security: Record<string, string[]>[] | undefined;
  hasHeaderAuth: boolean;
}

export interface RouteInfoOpts {
  route: RouteMetadata;
  params: ParamMetadata[];
  paramTypes: Constructor[];
  methodName: string;
}
