export type TypeFuncValue = unknown;
export type TypeFunc = () => TypeFuncValue;

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
  name?: string;
  type?: string;
  typeFunc?: TypeFunc | undefined;
  isArgs?: boolean;
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

export const RESOLVER_METADATA = Symbol.for('RESOLVER_METADATA');
export const OBJECT_TYPE_METADATA = Symbol.for('OBJECT_TYPE_METADATA');
export const INPUT_TYPE_METADATA = Symbol.for('INPUT_TYPE_METADATA');
export const FIELD_METADATA = Symbol.for('FIELD_METADATA');
