export type ApiControllerOptions = BaseControllerOptions;

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
