import { ProviderContract } from '@shardix/common';
import { SchedulerRegistry } from './scheduler.registry';
import { SchedulerService } from './scheduler.service';
import { SchedulerScanner } from './scheduler.scanner';

/**
 * The official Scheduler Provider for Shardix.
 */
export class SchedulerProvider implements ProviderContract {
  public readonly name = 'SchedulerProvider';
  public readonly version = '0.9.0';
  
  public registry: SchedulerRegistry;
  public service: SchedulerService;
  public scanner: SchedulerScanner;
  private app: any;

  constructor() {
    this.registry = new SchedulerRegistry();
    this.service = new SchedulerService(this.registry);
    this.scanner = new SchedulerScanner(this.registry);
  }

  /**
   * Registers the provider dependencies into the app container.
   * @param app The application instance
   */
  public async register(app: any): Promise<void> {
    this.app = app;
    if (app && app.container && typeof app.container.register === 'function') {
      app.container.register('SchedulerRegistry', this.registry);
      app.container.register('SchedulerService', this.service);
      app.container.register('SchedulerScanner', this.scanner);
    }
  }

  /**
   * Boots the provider, scans instances, and starts jobs.
   */
  public async boot(): Promise<void> {
    const app = this.app;
    let instancesToScan: any[] = [];
    if (app && typeof app.getInstances === 'function') {
      instancesToScan = app.getInstances();
    } else if (app && app.container && typeof app.container.getAll === 'function') {
      instancesToScan = app.container.getAll();
    }

    if (instancesToScan.length > 0) {
      this.scanner.scan(instancesToScan);
    }

    const jobs = this.registry.getAll();
    for (const job of jobs) {
      if ('runOnInit' in job.options && job.options.runOnInit) {
        void this.service.executeJob(job);
      }
      this.service.scheduleJob(job);
    }
  }
}

/**
 * Convenience function to create a SchedulerProvider instance.
 * @returns A new SchedulerProvider instance
 */
export function createSchedulerProvider(): SchedulerProvider {
  return new SchedulerProvider();
}
