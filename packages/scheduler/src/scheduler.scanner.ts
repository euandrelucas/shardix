import { SCHEDULER_CRON, SCHEDULER_INTERVAL, SCHEDULER_TIMEOUT } from './constants';
import { SchedulerRegistry } from './scheduler.registry';
import { ScheduledJob } from './scheduler.types';
import { CronOptions } from './decorators/cron.decorator';
import { IntervalOptions } from './decorators/interval.decorator';
import { TimeoutOptions } from './decorators/timeout.decorator';

/**
 * Scans class instances for scheduler decorators.
 */
export class SchedulerScanner {
  constructor(private readonly registry: SchedulerRegistry) {}

  /**
   * Scans an array of instances and registers decorated methods.
   * @param instances The instances to scan
   */
  public scan(instances: any[]): void {
    for (const instance of instances) {
      if (!instance || typeof instance !== 'object') continue;

      const prototype = Object.getPrototypeOf(instance);
      if (!prototype) continue;

      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) => name !== 'constructor' && typeof prototype[name] === 'function'
      );

      for (const methodName of methodNames) {
        this.scanMethod(instance, methodName);
      }
    }
  }

  private scanMethod(instance: any, methodName: string): void {
    const cronMeta = Reflect.getMetadata(SCHEDULER_CRON, instance, methodName) as { expression: string, options?: CronOptions } | undefined;
    const intervalMeta = Reflect.getMetadata(SCHEDULER_INTERVAL, instance, methodName) as { ms: number, options?: IntervalOptions } | undefined;
    const timeoutMeta = Reflect.getMetadata(SCHEDULER_TIMEOUT, instance, methodName) as { ms: number, options?: TimeoutOptions } | undefined;

    if (cronMeta) {
      const name = cronMeta.options?.name || `${instance.constructor.name}.${methodName}`;
      this.registry.register({
        name,
        type: 'cron',
        expression: cronMeta.expression,
        handler: instance[methodName].bind(instance),
        options: cronMeta.options || {},
        runCount: 0,
        errorCount: 0,
        status: 'idle',
      });
    }

    if (intervalMeta) {
      const name = intervalMeta.options?.name || `${instance.constructor.name}.${methodName}`;
      this.registry.register({
        name,
        type: 'interval',
        intervalMs: intervalMeta.ms,
        handler: instance[methodName].bind(instance),
        options: intervalMeta.options || {},
        runCount: 0,
        errorCount: 0,
        status: 'idle',
      });
    }

    if (timeoutMeta) {
      const name = timeoutMeta.options?.name || `${instance.constructor.name}.${methodName}`;
      this.registry.register({
        name,
        type: 'timeout',
        intervalMs: timeoutMeta.ms,
        handler: instance[methodName].bind(instance),
        options: timeoutMeta.options || {},
        runCount: 0,
        errorCount: 0,
        status: 'idle',
      });
    }
  }
}
