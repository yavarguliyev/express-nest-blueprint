export interface ExtractMethodOptions<T extends object, K extends keyof T> {
  instance: T;
  methodName: K;
}

export interface HasMethodOptions<T extends object> {
  instance: T;
  methodName: string;
}

export interface HandleProcessSignalsOptions<Args extends unknown[]> {
  callbackArgs: Args;
  shutdownCallback: (...args: Args) => Promise<void>;
}
