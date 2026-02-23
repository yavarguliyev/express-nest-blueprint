import { GraphQLFieldConfig, GraphQLOutputType, GraphQLFieldConfigArgumentMap, GraphQLInputType, GraphQLNonNull, GraphQLString } from 'graphql';

import { Container } from '../../container/container';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { GUARDS_METADATA } from '../../decorators/middleware.decorators';
import { FIELD_METADATA } from '../../../domain/constants/web/web.const';
import { getErrorMessage } from '../../../domain/helpers/utility-functions.helper';
import { AuthenticatedRequest } from '../../../domain/interfaces/auth/jwt.interface';
import { ArgMetadata, FieldMetadata } from '../../../domain/interfaces/web/graphql.interface';
import { CanActivate } from '../../../domain/interfaces/nest/guard.interface';
import { Constructor, TypeFunc } from '../../../domain/types/common/util.type';
import { GraphQLContext } from '../../../domain/types/nest/nest-core.type';

export class FieldConfigBuilder {
  private container: Container;
  private resolveType: (typeInput: unknown) => GraphQLOutputType | GraphQLInputType;

  constructor (container: Container, resolveType: (typeInput: unknown) => GraphQLOutputType | GraphQLInputType) {
    this.container = container;
    this.resolveType = resolveType;
  }

  createFieldConfig (
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
        await this.executeGuards(ResolverClass, methodName, context, method);
        const methodArgs = this.buildMethodArgs(args, resolverArgs, context);
        return method.apply(resolverInstance, methodArgs);
      }
    };
  }

  private async executeGuards (
    ResolverClass: Constructor,
    methodName: string,
    context: unknown,
    method: (...methodArgs: unknown[]) => Promise<unknown>
  ): Promise<void> {
    const { req, res } = context as GraphQLContext;
    const guardsToRun = this.collectGuards(ResolverClass, methodName);

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
  }

  private collectGuards (ResolverClass: Constructor, methodName: string): Constructor<CanActivate>[] {
    const classGuards = (Reflect.getMetadata(GUARDS_METADATA, ResolverClass) || []) as Constructor<CanActivate>[];
    const methodGuards = (Reflect.getMetadata(GUARDS_METADATA, ResolverClass.prototype as object, methodName) || []) as Constructor<CanActivate>[];

    return [AuthGuard, RolesGuard, ...classGuards, ...methodGuards];
  }

  private buildMethodArgs (args: ArgMetadata[], resolverArgs: Record<string, unknown>, context: unknown): unknown[] {
    const { req } = context as GraphQLContext;

    return args
      .sort((a, b): number => a.index - b.index)
      .map((arg): unknown => {
        if (arg.isArgs && arg.typeFunc) return this.buildArgsObject(arg.typeFunc, resolverArgs);
        if (arg.isCurrentUser) return (req as AuthenticatedRequest).user;
        return arg.name ? resolverArgs[arg.name] : undefined;
      });
  }

  private buildArgsObject (typeFunc: TypeFunc, resolverArgs: Record<string, unknown>): Record<string, unknown> {
    const argsType = typeFunc();
    const fieldMetadata = (Reflect.getMetadata(FIELD_METADATA, argsType as object) || []) as FieldMetadata[];
    const argsObj: Record<string, unknown> = {};

    for (const field of fieldMetadata) argsObj[field.name] = resolverArgs[field.name];

    return argsObj;
  }

  private buildArgs (args: ArgMetadata[]): GraphQLFieldConfigArgumentMap {
    const graphqlArgs: GraphQLFieldConfigArgumentMap = {};
    for (const arg of args) {
      if (arg.isArgs && arg.typeFunc) this.addArgsTypeFields(arg.typeFunc, graphqlArgs);
      else if (arg.name) this.addSingleArg(arg, graphqlArgs);
    }

    return graphqlArgs;
  }

  private addArgsTypeFields (typeFunc: TypeFunc, graphqlArgs: GraphQLFieldConfigArgumentMap): void {
    const argsType = typeFunc();
    const fieldMetadata = (Reflect.getMetadata(FIELD_METADATA, argsType as object) || []) as FieldMetadata[];

    for (const field of fieldMetadata) {
      const fieldType = field.typeFunc ? this.resolveType(field.typeFunc) : this.resolveType(field.type);
      graphqlArgs[field.name] = {
        type: field.nullable ? (fieldType as GraphQLInputType) : new GraphQLNonNull(fieldType as GraphQLInputType)
      };
    }
  }

  private addSingleArg (arg: ArgMetadata, graphqlArgs: GraphQLFieldConfigArgumentMap): void {
    const type = arg.typeFunc ? this.resolveType(arg.typeFunc) : GraphQLString;

    graphqlArgs[arg.name!] = {
      type: arg.nullable ? (type as GraphQLInputType) : new GraphQLNonNull(type as GraphQLInputType)
    };
  }
}
