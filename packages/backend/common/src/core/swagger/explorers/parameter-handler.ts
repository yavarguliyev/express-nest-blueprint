import { SchemaGenerator } from './schema-generator';
import { ParamMetadata } from '../../../domain/interfaces/nest/nest-core.interface';
import { OpenAPIOperation } from '../../../domain/interfaces/infra/swagger-config.interface';
import { Constructor } from '../../../domain/types/common/util.type';

export class ParameterHandler {
  constructor (private readonly schemaGenerator: SchemaGenerator) {}

  addParametersToOperation (operation: OpenAPIOperation, params: ParamMetadata[], paramTypes: Constructor[]): void {
    params.forEach(param => {
      const type: Constructor | undefined = paramTypes[param.index];
      this.processParameter(operation, param, type);
    });
  }

  private processParameter (operation: OpenAPIOperation, param: ParamMetadata, type: Constructor | undefined): void {
    if (param.type === 'body') this.addBodyParameter(operation, type);
    else if (param.type === 'query') this.addQueryParameter(operation, param, type);
    else if (param.type === 'param') this.addPathParameter(operation, param);
  }

  private addBodyParameter (operation: OpenAPIOperation, type: Constructor | undefined): void {
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: this.schemaGenerator.getSchemaForType(type)
        }
      }
    };
  }

  private addQueryParameter (operation: OpenAPIOperation, param: ParamMetadata, type: Constructor | undefined): void {
    if (param.data && typeof param.data === 'string') {
      operation.parameters?.push({
        name: param.data,
        in: 'query',
        required: false,
        schema: { type: 'string' }
      });
    } else if (type && (type as unknown) !== Object) {
      this.addQueryParametersFromSchema(operation, type);
    }
  }

  private addQueryParametersFromSchema (operation: OpenAPIOperation, type: Constructor): void {
    const schema = this.schemaGenerator.getSchemaForType(type);
    if (!schema.$ref) return;

    const schemaName = schema.$ref.split('/').pop()!;
    const schemas = this.schemaGenerator.getSchemas();
    const properties = schemas[schemaName]?.properties || {};

    Object.keys(properties).forEach(prop => {
      const propSchema = properties[prop]!;
      operation.parameters?.push({
        name: prop,
        in: 'query',
        required: (schemas[schemaName]?.required || []).includes(prop),
        schema: '$ref' in propSchema ? { type: 'object' } : propSchema
      });
    });
  }

  private addPathParameter (operation: OpenAPIOperation, param: ParamMetadata): void {
    operation.parameters?.push({
      name: (param.data as string) || 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' }
    });
  }
}
