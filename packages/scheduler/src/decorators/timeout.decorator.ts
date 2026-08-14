import { SCHEDULER_TIMEOUT } from '../constants';

export interface TimeoutOptions {
  name?: string;
  disabled?: boolean;
}

/**
 * Runs the method once after N milliseconds.
 * 
 * @param ms Timeout in milliseconds
 * @param options Optional settings for the timeout job
 */
export function Timeout(ms: number, options?: TimeoutOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(SCHEDULER_TIMEOUT, { ms, options }, target, propertyKey);
    return descriptor;
  };
}
