import { WithStringKey, WithValue } from '../../../domain/interfaces/common/shared-properties.interface';
import { INITIALIZER_TOKENS } from '../../constants/module/initializer-tokens.const';

export type Constructor<T = object, Args extends unknown[] = never[]> = new (...args: Args) => T;

export type IdType = string | number;

export type AbstractConstructor<T = object, Args extends unknown[] = never[]> = abstract new (...args: Args) => T;

export type InitializerToken = (typeof INITIALIZER_TOKENS)[number];

export type TypeFuncValue = unknown;

export type TypeFunc = () => TypeFuncValue;

export type ExceptionClass<T extends Error = Error, Args extends unknown[] = never[]> = new (...args: Args) => T;

export type ParserType = 'boolean' | 'number' | 'string';

export type ParserFn = (v: string, def?: unknown) => unknown;

export type PatchedMethodType = {
  (...args: unknown[]): Promise<unknown>;
  __original__?: (...args: unknown[]) => Promise<unknown>;
};

export type SortBy = 'id' | 'firstName' | 'lastName' | 'email' | 'createdAt';

export type SortOrder = 'ASC' | 'DESC';

export type TimeUnit = 's' | 'm' | 'h' | 'd';

export type WhereConditions = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'NOT IN';

export type JwtRegisteredClaim = 'iat' | 'exp';

export type SettingValue = WithStringKey & WithValue;
