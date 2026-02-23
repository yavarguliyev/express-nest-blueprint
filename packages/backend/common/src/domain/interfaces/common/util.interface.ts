import { WithInstance, WithMethodName, WithCallbackArgs, WithAsyncCallback } from './base.interface';

export interface ExtractMethodOptions<T extends object, K extends keyof T> extends WithInstance<T>, WithMethodName<K> {}

export interface HasMethodOptions<T extends object> extends WithInstance<T>, WithMethodName {}

export interface HandleProcessSignalsOptions<Args extends unknown[]> extends WithCallbackArgs<Args>, WithAsyncCallback<Args> {}
