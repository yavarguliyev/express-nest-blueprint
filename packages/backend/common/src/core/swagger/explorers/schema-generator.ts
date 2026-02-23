import { getMetadataStorage } from 'class-validator';

import { OpenAPISchema } from '../../../domain/interfaces/infra/swagger-config.interface';
import { Constructor } from '../../../domain/types/common/util.type';

export class SchemaGenerator {
  private readonly schemas: Record<string, OpenAPISchema> = {};

  getSchemas(): Record<string, OpenAPISchema> {
    return this.schemas;
  }

  getSchemaForType(type: Constructor | undefined): OpenAPISchema | { $ref: string } {
    if (this.isPrimitiveType(type)) return this.getPrimitiveSchema(type);
    if (!type) return this.getPrimitiveSchema(type);

    const name = type.name;

    if (this.schemas[name]) return { $ref: `#/components/schemas/${name}` };
    this.generateSchemaForType(type);
    return { $ref: `#/components/schemas/${name}` };
  }

  private isPrimitiveType(type: Constructor | undefined): boolean {
    return !type || (type as unknown) === Object || (type as unknown) === String || (type as unknown) === Number || (type as unknown) === Boolean;
  }

  private getPrimitiveSchema(type: Constructor | undefined): OpenAPISchema {
    if ((type as unknown) === Number) return { type: 'number' };
    if ((type as unknown) === Boolean) return { type: 'boolean' };
    return { type: 'string' };
  }

  private generateSchemaForType(type: Constructor): void {
    const name = type.name;
    const schema: OpenAPISchema = {
      type: 'object',
      properties: {},
      required: []
    };

    const metadataStorage = getMetadataStorage();
    const targetMetadata = metadataStorage.getTargetValidationMetadatas(type, '', false, false);
    this.processMetadata(schema, targetMetadata);
    if (schema.required && schema.required.length === 0) delete schema.required;
    this.schemas[name] = schema;
  }

  private processMetadata(
    schema: OpenAPISchema,
    targetMetadata: Array<{
      type: string;
      propertyName: string;
      constraints?: unknown[];
    }>
  ): void {
    targetMetadata.forEach(meta => this.processPropertyMetadata(schema, meta));
  }

  private processPropertyMetadata(
    schema: OpenAPISchema,
    meta: {
      type: string;
      propertyName: string;
      constraints?: unknown[];
    }
  ): void {
    const prop = meta.propertyName;
    if (!schema.properties) schema.properties = {};
    if (!schema.properties[prop]) schema.properties[prop] = this.createPropertySchema(meta);
    if (meta.type === 'isNotEmpty' && !schema.required?.includes(prop)) schema.required?.push(prop);
  }

  private createPropertySchema(meta: { type: string; constraints?: unknown[] }): OpenAPISchema {
    const propSchema: OpenAPISchema = { type: 'string' };

    if (meta.type === 'isBoolean') propSchema.type = 'boolean';
    if (meta.type === 'isNumber') propSchema.type = 'number';
    if (meta.type === 'isEmail') propSchema.format = 'email';
    if (meta.type === 'isEnum') {
      const enumValues = meta.constraints?.[0];
      propSchema.enum = typeof enumValues === 'object' && enumValues !== null ? Object.values(enumValues) : (enumValues as unknown[]);
    }

    return propSchema;
  }
}
