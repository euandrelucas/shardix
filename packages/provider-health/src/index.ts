import { ProviderContract } from '@shardix/common';

export type HealthCheckFn = () => boolean | Promise<boolean>;

export interface HealthCheckResult {
  status: 'ok' | 'error';
  uptime: number;
  checks: Record<string, boolean>;
}

export class HealthProvider implements ProviderContract {
  public readonly name = 'HealthProvider';
  public readonly version = '0.3.0';
  private checks = new Map<string, HealthCheckFn>();
  private startTime = Date.now();

  public async register(app: any): Promise<void> {
    const container = app.getContainer();
    container.register({
      provide: HealthProvider,
      useValue: this,
    });
  }

  public addCheck(name: string, checkFn: HealthCheckFn): void {
    this.checks.set(name, checkFn);
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const results: Record<string, boolean> = {};
    let isOverallOk = true;

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const ok = await checkFn();
        results[name] = ok;
        if (!ok) isOverallOk = false;
      } catch {
        results[name] = false;
        isOverallOk = false;
      }
    }

    return {
      status: isOverallOk ? 'ok' : 'error',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: results,
    };
  }
}
