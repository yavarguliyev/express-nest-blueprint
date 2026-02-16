import { TypeFunc } from '../../types/common/util.type';

export interface ResolverMetadata {
  name?: string;
  typeFunc?: TypeFunc | undefined;
}

export interface QueryMetadata {
  name: string;
  typeFunc: TypeFunc;
}

export interface MutationMetadata {
  name: string;
  typeFunc: TypeFunc;
}

export interface ArgMetadata {
  index: number;
  name?: string | undefined;
  type?: string | undefined;
  typeFunc?: TypeFunc | undefined;
  isArgs?: boolean | undefined;
  isCurrentUser?: boolean | undefined;
  nullable?: boolean | undefined;
}

export interface FieldMetadata {
  name: string;
  type?: string | undefined;
  typeFunc?: TypeFunc | undefined;
  nullable?: boolean | undefined;
}

export interface ObjectTypeMetadata {
  name: string;
  fields: FieldMetadata[];
}

export interface InputTypeMetadata {
  name: string;
}

export interface ResolverEntry {
  resolver: object;
  metadata: ResolverMetadata;
}
