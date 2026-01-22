import { QueryMetadata, MutationMetadata, ArgMetadata, TypeFunc } from '../interfaces/graphql.interface';

export const QUERY_METADATA = Symbol.for('GQL_QUERY_METADATA');
export const MUTATION_METADATA = Symbol.for('GQL_MUTATION_METADATA');
export const ARG_METADATA = Symbol.for('GQL_ARG_METADATA');

export const Query = (typeFunc: TypeFunc, options?: { name?: string }): MethodDecorator => {
  return (target: object, propertyKey: string | symbol | undefined): void => {
    if (propertyKey) {
      const queryName = options?.name || String(propertyKey);
      const existingQueries = (Reflect.getMetadata(QUERY_METADATA, target, propertyKey) || []) as QueryMetadata[];

      existingQueries.push({ name: queryName, typeFunc });
      Reflect.defineMetadata(QUERY_METADATA, existingQueries, target, propertyKey);
    }
  };
};

export const Mutation = (typeFunc: TypeFunc, options?: { name?: string }): MethodDecorator => {
  return (target: object, propertyKey: string | symbol | undefined): void => {
    if (propertyKey) {
      const mutationName = options?.name || String(propertyKey);
      const existingMutations = (Reflect.getMetadata(MUTATION_METADATA, target, propertyKey) || []) as MutationMetadata[];
      existingMutations.push({ name: mutationName, typeFunc });
      Reflect.defineMetadata(MUTATION_METADATA, existingMutations, target, propertyKey);
    }
  };
};

export const Arg = (name: string, typeFunc?: TypeFunc): ParameterDecorator => {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    if (propertyKey) {
      const existingArgs = (Reflect.getMetadata(ARG_METADATA, target, propertyKey) || []) as ArgMetadata[];

      let effectiveTypeFunc = typeFunc;
      if (!effectiveTypeFunc) {
        const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) as unknown[] | undefined;
        if (paramTypes && paramTypes[parameterIndex]) {
          const type = paramTypes[parameterIndex];
          effectiveTypeFunc = () => type;
        }
      }

      existingArgs.push({ index: parameterIndex, name, typeFunc: effectiveTypeFunc });
      Reflect.defineMetadata(ARG_METADATA, existingArgs, target, propertyKey);
    }
  };
};

export const Args = (typeFunc?: TypeFunc): ParameterDecorator => {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    if (propertyKey) {
      const existingArgs = (Reflect.getMetadata(ARG_METADATA, target, propertyKey) || []) as ArgMetadata[];

      let effectiveTypeFunc = typeFunc;
      if (!effectiveTypeFunc) {
        const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) as unknown[] | undefined;
        if (paramTypes && paramTypes[parameterIndex]) {
          const type = paramTypes[parameterIndex];
          effectiveTypeFunc = () => type;
        }
      }

      existingArgs.push({ index: parameterIndex, typeFunc: effectiveTypeFunc, isArgs: true });
      Reflect.defineMetadata(ARG_METADATA, existingArgs, target, propertyKey);
    }
  };
};

export const GqlCurrentUser = (): ParameterDecorator => {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    if (propertyKey) {
      const existingArgs = (Reflect.getMetadata(ARG_METADATA, target, propertyKey) || []) as ArgMetadata[];
      existingArgs.push({ index: parameterIndex, isCurrentUser: true });
      Reflect.defineMetadata(ARG_METADATA, existingArgs, target, propertyKey);
    }
  };
};

export const CurrentUser = GqlCurrentUser;
