import { ProviderContract } from '@shardix/common';

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  attempts: number;
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<void>;

export class QueueService {
  private handlers = new Map<string, JobHandler>();
  private jobs: Job[] = [];

  public process(jobName: string, handler: JobHandler): void {
    this.handlers.set(jobName, handler);
  }

  public async add<T = any>(jobName: string, data: T): Promise<Job<T>> {
    const job: Job<T> = {
      id: Math.random().toString(36).substring(2, 9),
      name: jobName,
      data,
      attempts: 0,
    };
    this.jobs.push(job);

    const handler = this.handlers.get(jobName);
    if (handler) {
      job.attempts++;
      await handler(job);
    }

    return job;
  }

  public getJobs(): Job[] {
    return this.jobs;
  }
}

export class QueueProvider implements ProviderContract {
  public readonly name = 'QueueProvider';
  public readonly version = '0.4.0';
  private queueService = new QueueService();

  public async register(app: any): Promise<void> {
    const container = app.getContainer();
    container.register({
      provide: QueueService,
      useValue: this.queueService,
    });
    container.register({
      provide: QueueProvider,
      useValue: this,
    });
  }

  public getQueueService(): QueueService {
    return this.queueService;
  }
}
