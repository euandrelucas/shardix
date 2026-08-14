import { SCHEDULER_INTERVAL } from '../constants';

export interface IntervalOptions {
  name?: string;
  runOnInit?: boolean;
  disabled?: boolean;
}

/**
 * Repeats the method every N milliseconds.
 * 
 * @param ms Interval in milliseconds
 * @param options Optional settings for the interval job
 */
export function Interval(ms: number, options?: IntervalOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(SCHEDULER_INTERVAL, { ms, options }, target, propertyKey);
    return descriptor;
  };
}
