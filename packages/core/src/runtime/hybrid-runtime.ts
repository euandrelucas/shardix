import { BaseRuntime } from './runtime.js';
import { GatewayRuntime, GatewayRuntimeOptions } from './gateway-runtime.js';
import { HttpRuntime } from './http-runtime.js';
import { HttpOptions } from '@shardix/http';

export interface HybridRuntimeOptions {
  gateway: GatewayRuntimeOptions;
  http?: HttpOptions;
}

export class HybridRuntime extends BaseRuntime {
  public readonly name = 'HybridRuntime';
  private gatewayRuntime: GatewayRuntime;
  private httpRuntime: HttpRuntime;

  constructor(options: HybridRuntimeOptions) {
    super();
    this.gatewayRuntime = new GatewayRuntime(options.gateway);
    this.httpRuntime = new HttpRuntime(options.http);
  }

  protected async onStart(): Promise<void> {
    if (!this.app) return;
    await Promise.all([
      this.gatewayRuntime.start(this.app),
      this.httpRuntime.start(this.app),
    ]);
  }

  protected async onStop(): Promise<void> {
    await Promise.all([
      this.gatewayRuntime.stop(),
      this.httpRuntime.stop(),
    ]);
  }
}
