import { Type } from '@shardix/common';
import { ReflectionContainer } from '../reflection/reflection-container.js';
import type { ShardixApplication } from '../application/shardix-application.js';

export class AutoScanner {
  public static scanAndRegister(app: ShardixApplication, exportList: any[]): void {
    for (const item of exportList) {
      if (typeof item === 'function') {
        const meta = ReflectionContainer.reflect(item as Type<any>);

        if (meta.isModule) {
          app.register(item as Type<any>);
        } else if (meta.isController) {
          app.getContainer().register(item as Type<any>);
          app.getRouter().registerController(item as Type<any>);
        } else if (meta.isInjectable) {
          app.getContainer().register(item as Type<any>);
        }
      }
    }
  }
}
