export type Resolve<T> = (value: T | PromiseLike<T>) => void;
export type Reject = (reason?: any) => void;

export class Deferred<T> {
  readonly promise: Promise<T>;
  resolve!: Resolve<T>;
  reject!: Reject;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
