import {
  GraphQLOutputType,
  GraphQLInputType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLFieldConfigMap
} from 'graphql';

import { GraphQLJSONObject } from '../scalars/json.scalar';
import { OBJECT_TYPE_METADATA, INPUT_TYPE_METADATA, FIELD_METADATA } from '../../../domain/constants/web/web.const';
import { FieldMetadata } from '../../../domain/interfaces/web/graphql.interface';
import { TypeFuncValue, Constructor } from '../../../domain/types/common/util.type';

export class TypeEvaluator {
  private readonly typeCache: Map<unknown, GraphQLOutputType | GraphQLInputType>;

  constructor (typeCache: Map<unknown, GraphQLOutputType | GraphQLInputType>) {
    this.typeCache = typeCache;
  }

  resolveEvaluatedType (type: TypeFuncValue): GraphQLOutputType | GraphQLInputType {
    if (Array.isArray(type)) return new GraphQLList(this.resolveEvaluatedType(type[0]) as GraphQLOutputType);
    if (this.isPrimitiveType(type)) return this.resolvePrimitiveType(type);
    if (this.isJSONType(type)) return GraphQLJSONObject;
    if (this.typeCache.has(type)) return this.typeCache.get(type)!;
    if (typeof type === 'function') return this.resolveConstructorType(type as Constructor);
    return GraphQLString;
  }

  private isPrimitiveType (type: TypeFuncValue): boolean {
    return type === String || type === 'String' || type === Number || type === 'Number' || type === 'Int' || type === Boolean || type === 'Boolean';
  }

  private resolvePrimitiveType (type: TypeFuncValue): GraphQLOutputType | GraphQLInputType {
    if (type === String || type === 'String') return GraphQLString;
    if (type === Number || type === 'Number' || type === 'Int') return GraphQLInt;
    if (type === Boolean || type === 'Boolean') return GraphQLBoolean;
    return GraphQLString;
  }

  private isJSONType (type: TypeFuncValue): boolean {
    return (
      type === 'JSON' ||
      type === 'JSONObject' ||
      type === GraphQLJSONObject ||
      (typeof type === 'function' && (type as Constructor).name === 'Object')
    );
  }

  private resolveConstructorType (constructor: Constructor): GraphQLOutputType | GraphQLInputType {
    const objectMetadata = Reflect.getMetadata(OBJECT_TYPE_METADATA, constructor as object) as { name: string } | undefined;
    if (objectMetadata) return this.buildObjectType(constructor, objectMetadata);

    const inputMetadata = Reflect.getMetadata(INPUT_TYPE_METADATA, constructor as object) as { name: string } | undefined;
    if (inputMetadata) return this.buildInputType(constructor, inputMetadata);

    return GraphQLString;
  }

  private buildObjectType (constructor: Constructor, metadata: { name: string }): GraphQLObjectType {
    const gqlType = new GraphQLObjectType({
      name: metadata.name,
      fields: (): GraphQLFieldConfigMap<unknown, unknown> => {
        const fields: GraphQLFieldConfigMap<unknown, unknown> = {};
        const fieldMetadata = (Reflect.getMetadata(FIELD_METADATA, constructor) || []) as FieldMetadata[];

        for (const field of fieldMetadata) {
          const fieldType = this.resolveFieldType(field);
          fields[field.name] = {
            type: field.nullable ? (fieldType as GraphQLOutputType) : new GraphQLNonNull(fieldType as GraphQLOutputType)
          };
        }

        return fields;
      }
    });

    this.typeCache.set(constructor, gqlType);
    return gqlType;
  }

  private buildInputType (constructor: Constructor, metadata: { name: string }): GraphQLInputObjectType {
    const gqlType = new GraphQLInputObjectType({
      name: metadata.name,
      fields: (): Record<string, { type: GraphQLInputType }> => {
        const fields: Record<string, { type: GraphQLInputType }> = {};
        const fieldMetadata = (Reflect.getMetadata(FIELD_METADATA, constructor) || []) as FieldMetadata[];

        for (const field of fieldMetadata) {
          const fieldType = this.resolveFieldType(field);
          fields[field.name] = {
            type: field.nullable ? (fieldType as GraphQLInputType) : new GraphQLNonNull(fieldType as GraphQLInputType)
          };
        }

        return fields;
      }
    });

    this.typeCache.set(constructor, gqlType);
    return gqlType;
  }

  private resolveFieldType (field: FieldMetadata): GraphQLOutputType | GraphQLInputType {
    if (field.typeFunc) {
      const typeFunc = field.typeFunc;
      return this.resolveEvaluatedType(typeFunc());
    }

    return this.resolveEvaluatedType(field.type);
  }
}
