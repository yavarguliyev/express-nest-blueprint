import { GraphQLOutputType } from 'graphql';

const TYPE_REGISTRY = new Map<string, GraphQLOutputType>();
const RETURN_TYPE_MAPPINGS = new Map<string, string>();

export const registerGraphQLType = (name: string, type: GraphQLOutputType): void => {
  TYPE_REGISTRY.set(name, type);
};

export const registerReturnType = (operationName: string, typeName: string): void => {
  RETURN_TYPE_MAPPINGS.set(operationName, typeName);
};

export const getRegisteredType = (name: string): GraphQLOutputType | undefined => {
  return TYPE_REGISTRY.get(name);
};

export const getReturnTypeForOperation = (operationName: string): GraphQLOutputType | undefined => {
  const typeName = RETURN_TYPE_MAPPINGS.get(operationName);
  if (typeName) return TYPE_REGISTRY.get(typeName);
  return undefined;
};

export const getAllRegisteredTypes = (): Map<string, GraphQLOutputType> => {
  return TYPE_REGISTRY;
};
