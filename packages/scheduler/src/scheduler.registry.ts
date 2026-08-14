import { ScheduledJob, SchedulerStats } from './scheduler.types';

/**
 * Registry for maintaining scheduled jobs.
 */
export class SchedulerRegistry {
  private readonly jobs = new Map<string, ScheduledJob>();

  /**
   * Registers a new job.
   * @param job The scheduled job to register
   */
  public register(job: ScheduledJob): void {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job with name ${job.name} already exists.`);
    }
    this.jobs.set(job.name, job);
  }

  /**
   * Retrieves a job by name.
   * @param name The name of the job
   * @returns The scheduled job or undefined
   */
  public get(name: string): ScheduledJob | undefined {
    return this.jobs.get(name);
  }

  /**
   * Retrieves all registered jobs.
   * @returns An array of all scheduled jobs
   */
  public getAll(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Starts a stopped job by name.
   * Note: The actual scheduling happens via SchedulerService.
   * This simply unmarks it as stopped.
   * @param name The name of the job to start
   */
  public start(name: string): void {
    const job = this.jobs.get(name);
    if (!job) return;
    if (job.status === 'stopped') {
      job.status = 'idle'; // It is now ready to be scheduled again
    }
  }

  /**
   * Stops a specific job by name.
   * @param name The name of the job to stop
   */
  public stop(name: string): void {
    const job = this.jobs.get(name);
    if (!job) return;
    
    if (job.handle) {
      if (job.type === 'interval') {
        clearInterval(job.handle);
      } else {
        clearTimeout(job.handle);
      }
      job.handle = null;
    }
    job.status = 'stopped';
  }

  /**
   * Stops all registered jobs gracefully.
   */
  public async stopAll(): Promise<void> {
    const stopPromises: Promise<void>[] = [];
    
    for (const job of this.jobs.values()) {
      if (job.status === 'running') {
        // Just clear timers to prevent new executions
        this.stop(job.name);
      } else {
        this.stop(job.name);
      }
    }
    
    await Promise.all(stopPromises);
  }

  /**
   * Retrieves statistics about all jobs.
   * @returns The scheduler statistics
   */
  public getStats(): SchedulerStats {
    let runningJobs = 0;
    let stoppedJobs = 0;
    let totalExecutions = 0;
    let totalErrors = 0;

    for (const job of this.jobs.values()) {
      if (job.status === 'running' || job.status === 'idle') {
        runningJobs++;
      } else if (job.status === 'stopped') {
        stoppedJobs++;
      }
      totalExecutions += job.runCount;
      totalErrors += job.errorCount;
    }

    return {
      totalJobs: this.jobs.size,
      runningJobs,
      stoppedJobs,
      totalExecutions,
      totalErrors,
    };
  }
}
