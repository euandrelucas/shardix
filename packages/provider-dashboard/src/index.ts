import { ProviderContract } from '@shardix/common';
import { DashboardApiServer } from '@shardix/dashboard-api';

export interface DashboardProviderOptions {
  port?: number;
  token?: string;
}

export class DashboardProvider implements ProviderContract {
  public readonly name = 'DashboardProvider';
  public readonly version = '0.5.0';
  private server: DashboardApiServer;

  constructor(options: DashboardProviderOptions = {}) {
    this.server = new DashboardApiServer({
      port: options.port || 3005,
      token: options.token || process.env.SHARDIX_DASHBOARD_TOKEN || 'shardix_secret_token',
    });
  }

  public async register(app: any): Promise<void> {
    const container = app.getContainer();
    container.register({
      provide: DashboardProvider,
      useValue: this,
    });
  }

  public async boot(): Promise<void> {
    await this.server.start();
  }

  public async shutdown(): Promise<void> {
    await this.server.stop();
  }

  public getServer(): DashboardApiServer {
    return this.server;
  }
}
