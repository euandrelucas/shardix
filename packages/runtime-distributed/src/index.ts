import { BaseRuntime } from '@shardix/core';
import { ClusterManager } from '@shardix/cluster';
import { LocalIPCTransport, MessageTransport } from '@shardix/ipc';

export interface DistributedRuntimeOptions {
  workerCount?: number;
  ipc?: MessageTransport;
}

export class DistributedRuntime extends BaseRuntime {
  public readonly name = 'DistributedRuntime';
  private clusterManager: ClusterManager;
  private ipc: MessageTransport;

  constructor(options: DistributedRuntimeOptions = {}) {
    super();
    this.clusterManager = new ClusterManager();
    this.clusterManager.workers(options.workerCount || 2);
    this.ipc = options.ipc || new LocalIPCTransport();
  }

  protected async onStart(): Promise<void> {
    await this.clusterManager.startAll();
    await this.ipc.broadcast('runtime:started', { runtime: this.name });
  }

  protected async onStop(): Promise<void> {
    await this.ipc.broadcast('runtime:stopping', { runtime: this.name });
    await this.clusterManager.stopAll();
  }

  public getCluster(): ClusterManager {
    return this.clusterManager;
  }

  public getIPC(): MessageTransport {
    return this.ipc;
  }
}
