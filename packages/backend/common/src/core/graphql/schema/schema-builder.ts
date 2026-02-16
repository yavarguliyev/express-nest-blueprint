import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputType,
  GraphQLOutputType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLFieldConfigArgumentMap
} from 'graphql';

import { GraphQLJSONObject } from '../scalars/json.scalar';
import { Container } from '../../container/container';
import { QUERY_METADATA, MUTATION_METADATA, ARG_METADATA } from '../../decorators/field.decorators';
import { GUARDS_METADATA } from '../../decorators/middleware.decorators';
import { RESOLVER_REGISTRY } from '../../decorators/resolver.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { OBJECT_TYPE_METADATA, INPUT_TYPE_METADATA, FIELD_METADATA, RESOLVER_METADATA } from '../../../domain/constants/web/web.const';
import { getErrorMessage } from '../../../domain/helpers/utility-functions.helper';
import { AuthenticatedRequest } from '../../../domain/interfaces/auth/jwt.interface';
import { QueryMetadata, MutationMetadata, ArgMetadata, FieldMetadata } from '../../../domain/interfaces/web/graphql.interface';
import { CanActivate } from '../../../domain/interfaces/nest/guard.interface';
import { TypeFunc, TypeFuncValue, Constructor } from '../../../domain/types/common/util.type';
import { GraphQLContext } from '../../../domain/types/nest/nest-core.type';

export class SchemaBuilder {
  private container: Container;
  private readonly typeCache = new Map<unknown, GraphQLOutputType | GraphQLInputType>();

  constructor (container: Container) {
    this.container = container;
  }

  build (): GraphQLSchema {
    const queryFields: GraphQLFieldConfigMap<unknown, unknown> = {};
    const mutationFields: GraphQLFieldConfigMap<unknown, unknown> = {};

    for (const ResolverClass of RESOLVER_REGISTRY) {
      const resolverMetadata = Reflect.getMetadata(RESOLVER_METADATA, ResolverClass) as { name: string } | undefined;
      if (!resolverMetadata) continue;

      const resolverInstance = this.container.resolve({ provide: ResolverClass });
      const methodNames = Object.getOwnPropertyNames(ResolverClass.prototype).filter(name => name !== 'constructor');

      for (const methodName of methodNames) {
        const queries = (Reflect.getMetadata(QUERY_METADATA, ResolverClass.prototype as object, methodName) || []) as QueryMetadata[];
        const mutations = (Reflect.getMetadata(MUTATION_METADATA, ResolverClass.prototype as object, methodName) || []) as MutationMetadata[];
        const args = (Reflect.getMetadata(ARG_METADATA, ResolverClass.prototype as object, methodName) || []) as ArgMetadata[];

        for (const query of queries) {
          const returnType = this.resolveType(query.typeFunc) as GraphQLOutputType;
          queryFields[query.name] = this.createFieldConfig(ResolverClass, resolverInstance, methodName, args, returnType);
        }

        for (const mutation of mutations) {
          const returnType = this.resolveType(mutation.typeFunc) as GraphQLOutputType;
          mutationFields[mutation.name] = this.createFieldConfig(ResolverClass, resolverInstance, methodName, args, returnType);
        }
      }
    }

    const schema: { query?: GraphQLObjectType; mutation?: GraphQLObjectType } = {};

    if (Object.keys(queryFields).length > 0) schema.query = new GraphQLObjectType({ name: 'Query', fields: queryFields });
    if (Object.keys(mutationFields).length > 0) schema.mutation = new GraphQLObjectType({ name: 'Mutation', fields: mutationFields });

    if (!schema.query) {
      schema.query = new GraphQLObjectType({
        name: 'Query',
        fields: { _empty: { type: GraphQLString, resolve: (): string => 'GraphQL API' } }
      });
    }

    return new GraphQLSchema(schema);
  }

  clearCache (): void {
    this.typeCache.clear();
  }

  private resolveType (typeInput: unknown): GraphQLOutputType | GraphQLInputType {
    if (typeof typeInput === 'function') {
      const typeFunc = typeInput as TypeFunc;
      return this.resolveEvaluatedType(typeFunc());
    }

    return this.resolveEvaluatedType(typeInput);
  }

  private resolveEvaluatedType (type: TypeFuncValue): GraphQLOutputType | GraphQLInputType {
    if (Array.isArray(type)) return new GraphQLList(this.resolveEvaluatedType(type[0]) as GraphQLOutputType);
    if (type === String || type === 'String') return GraphQLString;
    if (type === Number || type === 'Number' || type === 'Int') return GraphQLInt;
    if (type === Boolean || type === 'Boolean') return GraphQLBoolean;
    if (
      type === 'JSON' ||
      type === 'JSONObject' ||
      type === GraphQLJSONObject ||
      (typeof type === 'function' && (type as Constructor).name === 'Object')
    ) {
      return GraphQLJSONObject;
    }

    if (this.typeCache.has(type)) return this.typeCache.get(type)!;
    if (typeof type === 'function') {
      const objectMetadata = Reflect.getMetadata(OBJECT_TYPE_METADATA, type as object) as { name: string } | undefined;
      if (objectMetadata) return this.buildObjectType(type as Constructor, objectMetadata);
      const inputMetadata = Reflect.getMetadata(INPUT_TYPE_METADATA, type as object) as { name: string } | undefined;
      if (inputMetadata) return this.buildInputType(type as Constructor, inputMetadata);
    }

    return GraphQLString;
  }

  private buildObjectType (constructor: Constructor, metadata: { name: string }): GraphQLObjectType {
    const gqlType = new GraphQLObjectType({
      name: metadata.name,
      fields: (): GraphQLFieldConfigMap<unknown, unknown> => {
        const fields: GraphQLFieldConfigMap<unknown, unknown> = {};
        const fieldMetadata = (Reflect.getMetadata(FIELD_METADATA, constructor) || []) as FieldMetadata[];

        for (const field of fieldMetadata) {
          const fieldType = field.typeFunc ? this.resolveType(field.typeFunc) : this.resolveEvaluatedType(field.type);
          fields[field.name] = { type: field.nullable ? (fieldType as GraphQLOutputType) : new GraphQLNonNull(fieldType as GraphQLOutputType) };
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
          const fieldType = field.typeFunc ? this.resolveType(field.typeFunc) : this.resolveEvaluatedType(field.type);
          fields[field.name] = { type: field.nullable ? (fieldType as GraphQLInputType) : new GraphQLNonNull(fieldType as GraphQLInputType) };
        }

        return fields;
      }
    });

    this.typeCache.set(constructor, gqlType);
    return gqlType;
  }

  private createFieldConfig (
    ResolverClass: Constructor,
    resolverInstance: object,
    methodName: string,
    args: ArgMetadata[],
    returnType: GraphQLOutputType
  ): GraphQLFieldConfig<unknown, unknown> {
    const method = Reflect.get(resolverInstance, methodName) as (...methodArgs: unknown[]) => Promise<unknown>;

    return {
      type: returnType,
      args: this.buildArgs(args),
      resolve: async (_source: unknown, resolverArgs: Record<string, unknown>, context: unknown): Promise<unknown> => {
        const { req, res } = context as GraphQLContext;

        const classGuards = (Reflect.getMetadata(GUARDS_METADATA, ResolverClass) || []) as Constructor<CanActivate>[];
        const methodGuards = (Reflect.getMetadata(GUARDS_METADATA, ResolverClass.prototype as object, methodName) ||
          []) as Constructor<CanActivate>[];
        const guardsToRun: Constructor<CanActivate>[] = [AuthGuard, RolesGuard, ...classGuards, ...methodGuards];

        for (const GuardClass of guardsToRun) {
          const guardInstance = this.container.resolve<CanActivate>({ provide: GuardClass });

          await new Promise<void>((resolve, reject) => {
            void guardInstance.canActivate(
              req,
              res,
              (err: unknown) => (err ? reject(new Error(getErrorMessage(err))) : resolve()),
              method,
              ResolverClass
            );
          });
        }

        const methodArgs = args
          .sort((a, b): number => a.index - b.index)
          .map((arg): unknown => {
            if (arg.isArgs && arg.typeFunc) {
              const argsType = arg.typeFunc();
              const fieldMetadata = (Reflect.getMetadata(FIELD_METADATA, argsType as object) || []) as FieldMetadata[];

              const argsObj: Record<string, unknown> = {};
              for (const field of fieldMetadata) {
                argsObj[field.name] = resolverArgs[field.name];
              }

              return argsObj;
            }

            if (arg.isCurrentUser) return (req as AuthenticatedRequest).user;
            return arg.name ? resolverArgs[arg.name] : undefined;
          });

        return method.apply(resolverInstance, methodArgs);
      }
    };
  }

  private buildArgs (args: ArgMetadata[]): GraphQLFieldConfigArgumentMap {
    const graphqlArgs: GraphQLFieldConfigArgumentMap = {};
    for (const arg of args) {
      if (arg.isArgs && arg.typeFunc) {
        const argsType = arg.typeFunc();
        const fieldMetadata = (Reflect.getMetadata(FIELD_METADATA, argsType as object) || []) as FieldMetadata[];

        for (const field of fieldMetadata) {
          const fieldType = field.typeFunc ? this.resolveType(field.typeFunc) : this.resolveEvaluatedType(field.type);
          graphqlArgs[field.name] = { type: field.nullable ? (fieldType as GraphQLInputType) : new GraphQLNonNull(fieldType as GraphQLInputType) };
        }
      } else if (arg.name) {
        const type = arg.typeFunc ? this.resolveType(arg.typeFunc) : GraphQLString;
        graphqlArgs[arg.name] = { type: arg.nullable ? (type as GraphQLInputType) : new GraphQLNonNull(type as GraphQLInputType) };
      }
    }

    return graphqlArgs;
  }
}
