import { getMetadataStorage } from 'class-validator';

import { REQUIRE_AUTH_KEY, ROLES_KEY, IS_PUBLIC_KEY } from '@common/decorators/auth.decorator';
import { CONTROLLER_METADATA } from '@common/decorators/controller.decorator';
import { RouteMetadata, ParamMetadata } from '@common/interfaces/common.interface';
import { PARAM_METADATA } from '@common/decorators/param.decorators';
import { ROUTE_METADATA } from '@common/decorators/route.decorators';
import { CONTROLLER_REGISTRY } from '@common/decorators/register-controller-class.helper';
import { API_SECURITY_KEY } from '@common/decorators/swagger.decorators';
import { OpenAPIObject, OpenAPIOperation, OpenAPISchema, SwaggerConfig } from '@common/interfaces/swagger-config.interface';
import { Constructor } from '@common/types/common.type';

export class SwaggerExplorer {
  private readonly schemas: Record<string, OpenAPISchema> = {};

  explore (config: SwaggerConfig): OpenAPIObject {
    const paths: Record<string, Record<string, OpenAPIOperation>> = {};

    CONTROLLER_REGISTRY.forEach((controller: Constructor) => {
      const controllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA, controller) as { path: string };
      const basePath = controllerMetadata?.path || '';
      const controllerRequiresAuth = Reflect.getMetadata(REQUIRE_AUTH_KEY, controller) as boolean;
      const controllerIsPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller) as boolean;

      const prototype = controller.prototype as object;
      const methods = Object.getOwnPropertyNames(prototype).filter((m) => m !== 'constructor');

      methods.forEach((methodName) => {
        const routes = (Reflect.getMetadata(ROUTE_METADATA, prototype, methodName) || []) as RouteMetadata[];
        const params = (Reflect.getMetadata(PARAM_METADATA, prototype, methodName) || []) as ParamMetadata[];
        const paramTypes = (Reflect.getMetadata('design:paramtypes', prototype, methodName) || []) as Constructor[];

        routes.forEach((route) => {
          const fullPath = this.normalizePath(basePath, route.path);
          const httpMethod = route.method.toLowerCase();

          if (!paths[fullPath]) paths[fullPath] = {};

          const operation: OpenAPIOperation = {
            summary: this.humanize(methodName),
            operationId: `${controller.name}_${methodName}`,
            tags: [this.humanize(controller.name.replace('Controller', ''))],
            responses: {
              '200': { description: 'Successful operation' },
              '400': { description: 'Bad Request' },
              '401': { description: 'Unauthorized' },
              '403': { description: 'Forbidden' },
              '500': { description: 'Internal Server Error' }
            },
            parameters: []
          };

          const methodRequiresAuth = Reflect.getMetadata(REQUIRE_AUTH_KEY, prototype, methodName) as boolean;
          const methodIsPublic = Reflect.getMetadata(IS_PUBLIC_KEY, prototype, methodName) as boolean;
          const roles = Reflect.getMetadata(ROLES_KEY, prototype, methodName) as string[];

          let requiresAuth = false;

          if (methodIsPublic) requiresAuth = false;
          else if (methodRequiresAuth) requiresAuth = true;
          else if (controllerIsPublic) requiresAuth = false;
          else if (controllerRequiresAuth) requiresAuth = true;

          if (requiresAuth || roles) operation.security = [{ bearerAuth: [] }];

          const methodSecurity = Reflect.getMetadata(API_SECURITY_KEY, prototype, methodName) as Record<string, string[]>[];
          const controllerSecurity = Reflect.getMetadata(API_SECURITY_KEY, controller) as Record<string, string[]>[];

          if (methodSecurity || controllerSecurity) {
            operation.security = [...(operation.security || []), ...(methodSecurity || []), ...(controllerSecurity || [])];
          }

          params.forEach((param) => {
            const type: Constructor | undefined = paramTypes[param.index];
            if (param.type === 'body') {
              operation.requestBody = {
                required: true,
                content: {
                  'application/json': { schema: this.getSchemaForType(type) }
                }
              };
            } else if (param.type === 'query') {
              if (param.data && typeof param.data === 'string') {
                operation.parameters?.push({
                  name: param.data,
                  in: 'query',
                  required: false,
                  schema: { type: 'string' }
                });
              } else if (type && (type as unknown) !== Object) {
                const schema = this.getSchemaForType(type);
                if (schema.$ref) {
                  const schemaName = schema.$ref.split('/').pop()!;
                  const properties = this.schemas[schemaName]?.properties || {};

                  Object.keys(properties).forEach((prop) => {
                    const propSchema = properties[prop]!;
                    operation.parameters?.push({
                      name: prop,
                      in: 'query',
                      required: (this.schemas[schemaName]?.required || []).includes(prop),
                      schema: '$ref' in propSchema ? { type: 'object' } : propSchema
                    });
                  });
                }
              }
            } else if (param.type === 'param') {
              operation.parameters?.push({
                name: (param.data as string) || 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              });
            }
          });

          paths[fullPath][httpMethod] = operation;
        });
      });
    });

    return {
      openapi: '3.0.0',
      info: {
        title: config.title,
        description: config.description,
        version: config.version
      },
      paths,
      components: {
        schemas: this.schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ...config.securitySchemes
        }
      }
    };
  }

  private getSchemaForType (type: Constructor | undefined): OpenAPISchema | { $ref: string } {
    if (!type || (type as unknown) === Object || (type as unknown) === String || (type as unknown) === Number || (type as unknown) === Boolean) {
      return { type: (type as unknown) === Number ? 'number' : (type as unknown) === Boolean ? 'boolean' : 'string' };
    }

    const name = type.name;
    if (this.schemas[name]) return { $ref: `#/components/schemas/${name}` };

    const schema: OpenAPISchema = { type: 'object', properties: {}, required: [] };
    const metadataStorage = getMetadataStorage();
    const targetMetadata = metadataStorage.getTargetValidationMetadatas(type, '', false, false);

    targetMetadata.forEach((meta: { type: string; propertyName: string; constraints?: unknown[] }) => {
      const prop = meta.propertyName;
      if (!schema.properties) schema.properties = {};

      if (!schema.properties[prop]) {
        const propSchema: OpenAPISchema = { type: 'string' };

        if (meta.type === 'isBoolean') propSchema.type = 'boolean';
        if (meta.type === 'isNumber') propSchema.type = 'number';
        if (meta.type === 'isEmail') propSchema.format = 'email';
        if (meta.type === 'isEnum') {
          const enumValues = meta.constraints?.[0];
          propSchema.enum = typeof enumValues === 'object' && enumValues !== null ? Object.values(enumValues) : (enumValues as unknown[]);
        }

        schema.properties[prop] = propSchema;
      }

      if (meta.type === 'isNotEmpty' && !schema.required?.includes(prop)) schema.required?.push(prop);
    });

    if (schema.required && schema.required.length === 0) delete schema.required;

    this.schemas[name] = schema;
    return { $ref: `#/components/schemas/${name}` };
  }

  private normalizePath (base: string, path: string): string {
    const combined = `/${base}/${path}`.replace(/\/+/g, '/');
    const result = combined.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
    return result === '' ? '/' : result;
  }

  private humanize (str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }
}
