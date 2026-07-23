import { HttpServer } from '@shardix/http';

export interface DashboardApiOptions {
  port?: number;
}

export class DashboardApiServer {
  private server: HttpServer;

  constructor(options: DashboardApiOptions = {}) {
    this.server = new HttpServer({ port: options.port || 3005 });
    this.registerEndpoints();
  }

  private registerEndpoints(): void {
    const fastify = this.server.getFastify();

    fastify.get('/applications', async () => ({
      name: 'Shardix Application',
      version: '0.4.0',
      status: 'running',
    }));

    fastify.get('/workers', async () => [
      { id: 'worker_1', status: 'healthy', memoryUsageMB: 24 },
      { id: 'worker_2', status: 'healthy', memoryUsageMB: 28 },
    ]);

    fastify.get('/health', async () => ({
      status: 'ok',
      checks: { database: true, redis: true, gateway: true },
    }));

    fastify.get('/metrics', async () => ({
      commandsExecuted: 1420,
      errors: 0,
      avgLatencyMs: 12.4,
    }));

    fastify.get('/events', async () => ({
      processed: 9800,
      distributed: true,
    }));

    fastify.get('/logs', async () => [
      { level: 'info', message: 'Application started', timestamp: Date.now() },
    ]);
  }

  public async start(): Promise<void> {
    await this.server.start();
  }

  public async stop(): Promise<void> {
    await this.server.stop();
  }
}
