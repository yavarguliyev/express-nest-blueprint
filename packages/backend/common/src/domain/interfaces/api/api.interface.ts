import { Constructor } from '../../../domain/types/common/util.type';
import { ParamMetadata, RouteMetadata } from '../nest/nest-core.interface';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string | undefined;
  message?: string | undefined;
  success: boolean;
}

export interface ApiVersionConfig {
  prefix?: string;
  version: string;
}

export interface BaseControllerOptions {
  path: string;
  prefix?: string;
  version?: string;
}

export interface ControllerOptions {
  path?: string;
}

export interface CorsOptions {
  allowedHeaders?: string;
  methods?: string;
  origin?: string;
}

export interface ControllerInfo {
  controller: Constructor;
  basePath: string;
  requiresAuth: boolean;
  isPublic: boolean;
  methods: string[];
}

export interface SecurityMetadata {
  requiresAuth: boolean;
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
