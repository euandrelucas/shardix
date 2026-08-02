import { METADATA_KEYS, Type } from '@shardix/common';
import { ReflectionContainer } from '../reflection/reflection-container.js';
import type { ShardixApplication } from '../application/shardix-application.js';

export class AutoScanner {
  /** Tracks which (controller, eventName) pairs have already been bound to prevent duplicate listeners */
  private static boundEvents = new WeakMap<object, Set<string>>();

  public static scanAndRegister(app: ShardixApplication, exportList: unknown[]): void {
    for (const item of exportList) {
      if (typeof item === 'function') {
        const meta = ReflectionContainer.reflect(item as Type<any>);

        if (meta.isModule) {
          app.register(item as Type<any>);
        } else if (meta.isController) {
          app.getContainer().register(item as Type<any>);
          app.getRouter().registerController(item as Type<any>);

          const adapter = app.getAdapter();
          if (adapter && typeof adapter.onEvent === 'function') {
            const events: Array<{ eventName: string }> = Reflect.getMetadata(METADATA_KEYS.EVENT, item) || [];
            let bound = AutoScanner.boundEvents.get(item);
            if (!bound) {
              bound = new Set<string>();
              AutoScanner.boundEvents.set(item, bound);
            }
            for (const ev of events) {
              const boundKey = `${String(item)}:${ev.eventName}`;
              if (!bound.has(boundKey)) {
                bound.add(boundKey);
                adapter.onEvent(ev.eventName, (...args: unknown[]) =>
                  app.getRouter().handleEvent(ev.eventName, ...args)
                );
              }
            }
          }
        } else if (meta.isInjectable) {
          app.getContainer().register(item as Type<any>);
        }
      }
    }
  }
}
