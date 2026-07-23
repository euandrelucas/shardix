import { DashboardApiServer } from '@shardix/dashboard-api';

export interface DashboardClientOptions {
  port?: number;
  token?: string;
}

export class ShardixDashboardControlPlane {
  private server: DashboardApiServer;

  constructor(options: DashboardClientOptions = {}) {
    this.server = new DashboardApiServer(options);
  }

  public async start(): Promise<void> {
    await this.server.start();
  }

  public async stop(): Promise<void> {
    await this.server.stop();
  }
}
