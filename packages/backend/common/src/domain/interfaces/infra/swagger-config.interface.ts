import { OpenApiParameterIn, OpenApiPropertyType } from '../../types/infra/swagger.type';

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  basePath?: string;
  tags?: string[];
  securitySchemes?: Record<string, SecurityScheme>;
  externalDocs?: {
    description: string;
    url: string;
  };
}

export interface OpenAPISchema {
  type: OpenApiPropertyType;
  format?: string;
  properties?: Record<string, OpenAPISchema | { $ref: string }>;
  items?: OpenAPISchema | { $ref: string };
  required?: string[];
  enum?: unknown[];
  $ref?: string;
}

export interface OpenAPIParameter {
  name: string;
  in: OpenApiParameterIn;
  required?: boolean;
  schema: OpenAPISchema;
  description?: string;
}

export interface OpenAPIResponse {
  description: string;
  content?: Record<string, { schema: OpenAPISchema | { $ref: string } }>;
}

export interface OpenAPIOperation {
  summary?: string;
  operationId?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: OpenAPISchema | { $ref: string } }>;
  };
  responses: Record<string, OpenAPIResponse>;
  security?: Record<string, string[]>[];
}

export interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  name?: string;
  in?: string;
}

export interface OpenAPIObject {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
  tags?: { name: string; description?: string }[];
}
