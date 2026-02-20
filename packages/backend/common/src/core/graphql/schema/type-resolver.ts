import { GraphQLOutputType, GraphQLInputType } from 'graphql';

import { TypeFunc, TypeFuncValue } from '../../../domain/types/common/util.type';
import { TypeEvaluator } from './type-evaluator';

export class TypeResolver {
  private typeEvaluator: TypeEvaluator;

  constructor (typeCache: Map<unknown, GraphQLOutputType | GraphQLInputType>) {
    this.typeEvaluator = new TypeEvaluator(typeCache);
  }

  resolveType (typeInput: unknown): GraphQLOutputType | GraphQLInputType {
    if (typeof typeInput === 'function') {
      const typeFunc = typeInput as TypeFunc;
      return this.typeEvaluator.resolveEvaluatedType(typeFunc());
    }

    return this.typeEvaluator.resolveEvaluatedType(typeInput);
  }

  resolveEvaluatedType (type: TypeFuncValue): GraphQLOutputType | GraphQLInputType {
    return this.typeEvaluator.resolveEvaluatedType(type);
  }
}
