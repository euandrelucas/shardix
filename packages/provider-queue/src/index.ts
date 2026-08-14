import { ProviderContract } from '@shardix/common';
import { randomUUID } from 'node:crypto';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'dead';

export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean;
  timeout?: number;
}

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  opts: Required<JobOptions>;
  attempts: number;
  status: JobStatus;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedReason?: string;
  progress?: number;
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<void> | void;

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  dead: number;
}

export interface QueueEvents {
  onActive?: (job: Job) => void;
  onCompleted?: (job: Job) => void;
  onFailed?: (job: Job, error: Error) => void;
  onProgress?: (job: Job, progress: number) => void;
}

/**
 * Metadata key for registering queue processors via decorators
 */
export const QUEUE_PROCESSOR_METADATA = 'shardix:queue:processor';

/** Internal metadata storage for @QueueProcessor decorator */
const processorMetaStore = new WeakMap<object, Array<{ name: string; method: string | symbol }>>();

/**
 * Decorator to register a queue processor method.
 * Usage: @QueueProcessor('job-name') on a class method.
 */
export function QueueProcessor(name: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const existing = processorMetaStore.get(target.constructor) ?? [];
    existing.push({ name, method: propertyKey });
    processorMetaStore.set(target.constructor, existing);
  };
}

/** Retrieve @QueueProcessor metadata for a class */
export function getQueueProcessors(ctor: new (...args: any[]) => any): Array<{ name: string; method: string | symbol }> {
  return processorMetaStore.get(ctor) ?? [];
}

export class QueueService {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, { handler: JobHandler, concurrency: number }> = new Map();
  private activeJobs: Map<string, Set<string>> = new Map();
  private events: QueueEvents[] = [];
  
  private completedQueue: string[] = [];
  private maxCompletedJobs: number;
  
  private processInterval: NodeJS.Timeout | null = null;

  constructor(options?: { maxCompletedJobs?: number }) {
    this.maxCompletedJobs = options?.maxCompletedJobs ?? 1000;
    this.startProcessingLoop();
  }

  /**
   * Registers a handler for a specific queue name
   */
  public process<T>(name: string, handler: JobHandler<T>, concurrency: number = 1): void {
    this.handlers.set(name, { handler, concurrency });
    this.activeJobs.set(name, new Set());
  }

  /**
   * Enqueues a job
   */
  public async add<T>(name: string, data: T, opts?: JobOptions): Promise<Job<T>> {
    const job: Job<T> = {
      id: randomUUID(),
      name,
      data,
      opts: {
        delay: opts?.delay ?? 0,
        priority: opts?.priority ?? 0,
        attempts: opts?.attempts ?? 1,
        backoff: opts?.backoff ?? { type: 'fixed', delay: 0 },
        removeOnComplete: opts?.removeOnComplete ?? false,
        timeout: opts?.timeout ?? 0,
      },
      attempts: 0,
      status: opts?.delay ? 'delayed' : 'waiting',
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Retries a failed job
   */
  public async retry(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    if (job.status !== 'failed') throw new Error(`Job ${jobId} is not failed`);
    
    job.status = 'waiting';
    job.failedReason = undefined;
  }

  /**
   * Removes a job
   */
  public async remove(jobId: string): Promise<boolean> {
    const deleted = this.jobs.delete(jobId);
    if (deleted) {
      const idx = this.completedQueue.indexOf(jobId);
      if (idx !== -1) this.completedQueue.splice(idx, 1);
    }
    return deleted;
  }

  /**
   * Retrieves a job by ID
   */
  public async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Retrieves jobs by status
   */
  public async getJobs(status?: JobStatus): Promise<Job[]> {
    const all = Array.from(this.jobs.values());
    if (status) return all.filter(j => j.status === status);
    return all;
  }

  /**
   * Returns current queue statistics
   */
  public getStats(): QueueStats {
    const stats: QueueStats = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, dead: 0 };
    for (const job of this.jobs.values()) {
      stats[job.status]++;
    }
    return stats;
  }

  /**
   * Registers queue event listeners
   */
  public on(events: QueueEvents): void {
    this.events.push(events);
  }

  private startProcessingLoop(): void {
    this.processInterval = setInterval(() => {
      this.tick();
    }, 100);
  }

  private async tick(): Promise<void> {
    const now = new Date();
    
    // Process delayed jobs
    for (const job of this.jobs.values()) {
      if (job.status === 'delayed' && now.getTime() >= job.createdAt.getTime() + job.opts.delay) {
        job.status = 'waiting';
      }
    }

    // Process waiting jobs based on handlers
    for (const [name, config] of this.handlers.entries()) {
      const activeForName = this.activeJobs.get(name)!;
      if (activeForName.size >= config.concurrency) continue;

      const waiting = Array.from(this.jobs.values())
        .filter(j => j.name === name && j.status === 'waiting')
        .sort((a, b) => b.opts.priority - a.opts.priority);

      for (const job of waiting) {
        if (activeForName.size >= config.concurrency) break;
        
        activeForName.add(job.id);
        job.status = 'active';
        job.processedAt = new Date();
        job.attempts++;
        
        this.emit('onActive', job);

        this.processJob(job, config.handler).finally(() => {
          activeForName.delete(job.id);
        });
      }
    }
  }

  private async processJob(job: Job, handler: JobHandler): Promise<void> {
    try {
      let timeoutId: NodeJS.Timeout | null = null;
      
      const executionPromise = Promise.resolve(handler(job));
      
      if (job.opts.timeout > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Job timeout')), job.opts.timeout);
        });
        await Promise.race([executionPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
      } else {
        await executionPromise;
      }
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      
      this.emit('onCompleted', job);
      
      if (job.opts.removeOnComplete) {
        this.jobs.delete(job.id);
      } else {
        this.completedQueue.push(job.id);
        this.enforceMaxCompleted();
      }

    } catch (error: any) {
      this.handleJobFailure(job, error);
    }
  }

  private handleJobFailure(job: Job, error: Error): void {
    job.failedReason = error.message;
    
    if (job.attempts < job.opts.attempts) {
      job.status = 'delayed';
      const delay = job.opts.backoff.type === 'exponential' 
        ? job.opts.backoff.delay * Math.pow(2, job.attempts)
        : job.opts.backoff.delay;
      
      job.opts.delay = delay;
      job.createdAt = new Date(); // reset createdAt to calculate new delay
    } else {
      job.status = job.opts.attempts > 1 ? 'dead' : 'failed';
    }
    
    this.emit('onFailed', job, error);
  }

  private enforceMaxCompleted(): void {
    while (this.completedQueue.length > this.maxCompletedJobs) {
      const oldestId = this.completedQueue.shift();
      if (oldestId) this.jobs.delete(oldestId);
    }
  }

  private emit<K extends keyof QueueEvents>(event: K, ...args: any[]): void {
    for (const listener of this.events) {
      if (listener[event]) {
        try {
          (listener[event] as any)(...args);
        } catch (e) {
          console.error(`Error in queue event listener: ${e}`);
        }
      }
    }
  }

  public stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
  }
}

export class QueueProvider implements ProviderContract {
  public name = 'QueueProvider';
  public version = '0.9.0';
  private maxCompletedJobs: number;

  constructor(options?: { maxCompletedJobs?: number }) {
    this.maxCompletedJobs = options?.maxCompletedJobs ?? 1000;
  }

  public async register(app: any): Promise<void> {
    const queueService = new QueueService({ maxCompletedJobs: this.maxCompletedJobs });
    app.singleton('QueueService', queueService);
  }
  
  public async boot?(): Promise<void> {
    // Optionally scan and register @QueueProcessor decorated methods
  }
}

/**
 * Creates a QueueProvider instance
 */
export function createQueueProvider(options?: { maxCompletedJobs?: number }): QueueProvider {
  return new QueueProvider(options);
}
