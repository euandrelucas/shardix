import { SCHEDULER_CRON } from '../constants';

export interface CronOptions {
  name?: string;
  timeZone?: string;
  runOnInit?: boolean;
  disabled?: boolean;
}

/**
 * Schedules the method to run on a cron expression.
 * Standard 5-field cron: minute hour day month weekday
 * 
 * @param expression The cron expression string
 * @param options Optional settings for the cron job
 */
export function Cron(expression: string, options?: CronOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(SCHEDULER_CRON, { expression, options }, target, propertyKey);
    return descriptor;
  };
}
