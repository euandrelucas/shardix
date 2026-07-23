import 'reflect-metadata';
import { METADATA_KEYS } from '../constants.js';

export interface RateLimitOptions {
  limit: number;
  window: string | number; // e.g. '1m', '10s', 60000
  message?: string;
}

export function RateLimit(options: RateLimitOptions): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(
        METADATA_KEYS.INTERCEPTORS,
        [{ isRateLimit: true, options }],
        target.constructor,
        propertyKey
      );
    } else {
      Reflect.defineMetadata(METADATA_KEYS.INTERCEPTORS, [{ isRateLimit: true, options }], target);
    }
  };
}
