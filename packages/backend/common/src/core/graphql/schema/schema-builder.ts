import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLFieldConfigMap, GraphQLInputType, GraphQLOutputType } from 'graphql';

import { Container } from '../../container/container';
import { QUERY_METADATA, MUTATION_METADATA, ARG_METADATA } from '../../decorators/field.decorators';
import { RESOLVER_REGISTRY } from '../../decorators/resolver.decorator';
import { RESOLVER_METADATA } from '../../../domain/constants/web/web.const';
import { QueryMetadata, MutationMetadata, ArgMetadata } from '../../../domain/interfaces/web/graphql.interface';
import { Constructor } from '../../../domain/types/common/util.type';
import { TypeResolver } from './type-resolver';
import { FieldConfigBuilder } from './field-config-builder';

export class SchemaBuilder {
  private container: Container;
  private readonly typeCache = new Map<unknown, GraphQLOutputType | GraphQLInputType>();
  private typeResolver: TypeResolver;
  private fieldConfigBuilder: FieldConfigBuilder;

  constructor (container: Container) {
    this.container = container;
    this.typeResolver = new TypeResolver(this.typeCache);
    this.fieldConfigBuilder = new FieldConfigBuilder(container, this.typeResolver.resolveType.bind(this.typeResolver));
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
        this.processQueries(ResolverClass, resolverInstance, methodName, queryFields);
        this.processMutations(ResolverClass, resolverInstance, methodName, mutationFields);
      }
    }

    return this.createSchema(queryFields, mutationFields);
  }

  clearCache (): void {
    this.typeCache.clear();
  }

  private processQueries (
    ResolverClass: Constructor,
    resolverInstance: object,
    methodName: string,
    queryFields: GraphQLFieldConfigMap<unknown, unknown>
  ): void {
    const queries = (Reflect.getMetadata(QUERY_METADATA, ResolverClass.prototype as object, methodName) || []) as QueryMetadata[];
    const args = (Reflect.getMetadata(ARG_METADATA, ResolverClass.prototype as object, methodName) || []) as ArgMetadata[];

    for (const query of queries) {
      const returnType = this.typeResolver.resolveType(query.typeFunc) as GraphQLOutputType;
      queryFields[query.name] = this.fieldConfigBuilder.createFieldConfig(ResolverClass, resolverInstance, methodName, args, returnType);
    }
  }

  private processMutations (
    ResolverClass: Constructor,
    resolverInstance: object,
    methodName: string,
    mutationFields: GraphQLFieldConfigMap<unknown, unknown>
  ): void {
    const mutations = (Reflect.getMetadata(MUTATION_METADATA, ResolverClass.prototype as object, methodName) || []) as MutationMetadata[];
    const args = (Reflect.getMetadata(ARG_METADATA, ResolverClass.prototype as object, methodName) || []) as ArgMetadata[];

    for (const mutation of mutations) {
      const returnType = this.typeResolver.resolveType(mutation.typeFunc) as GraphQLOutputType;
      mutationFields[mutation.name] = this.fieldConfigBuilder.createFieldConfig(ResolverClass, resolverInstance, methodName, args, returnType);
    }
  }

  private createSchema (queryFields: GraphQLFieldConfigMap<unknown, unknown>, mutationFields: GraphQLFieldConfigMap<unknown, unknown>): GraphQLSchema {
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
}
