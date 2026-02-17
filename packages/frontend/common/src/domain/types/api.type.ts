import { ApiProtocol, HttpMethod } from '../enums/api.enum';

export type Protocol = ApiProtocol;

export type Method = HttpMethod;

export type Endpoint = string;

export type Headers = Record<string, string>;

export type QueryParams = Record<string, string | number | boolean>;

export type RequestBody = unknown;

export type ResponseData<T> = T;
