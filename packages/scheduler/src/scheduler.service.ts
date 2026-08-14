import { SchedulerRegistry } from './scheduler.registry';
import { ScheduledJob } from './scheduler.types';

/**
 * Service for scheduling and executing jobs.
 */
export class SchedulerService {
  constructor(private readonly registry: SchedulerRegistry) {}

  /**
   * Schedules a given job based on its type.
   * @param job The scheduled job
   */
  public scheduleJob(job: ScheduledJob): void {
    if (job.options.disabled) {
      job.status = 'stopped';
      return;
    }
    
    if (job.status === 'stopped') {
      return;
    }

    if (job.type === 'interval') {
      if (!job.intervalMs) throw new Error('Interval job must have intervalMs');
      job.handle = setInterval(() => {
        void this.executeJob(job);
      }, job.intervalMs);
      job.status = 'idle';
    } else if (job.type === 'timeout') {
      if (!job.intervalMs) throw new Error('Timeout job must have intervalMs');
      job.handle = setTimeout(() => {
        void this.executeJob(job);
      }, job.intervalMs);
      job.status = 'idle';
    } else if (job.type === 'cron') {
      if (!job.expression) throw new Error('Cron job must have an expression');
      this.scheduleNextCron(job);
    }
  }

  /**
   * Executes the job handler and updates job metadata.
   * @param job The scheduled job to execute
   */
  public async executeJob(job: ScheduledJob): Promise<void> {
    job.status = 'running';
    job.lastRun = new Date();
    
    try {
      await job.handler();
      job.runCount++;
    } catch (error) {
      job.errorCount++;
      console.error(`Error executing job ${job.name}:`, error);
    } finally {
      const currentStatus = SchedulerService.readStatus(job);
      if (currentStatus === 'running') {
        job.status = 'idle';
      }
      if (job.type === 'cron' && currentStatus !== 'stopped') {
        this.scheduleNextCron(job);
      }
    }
  }

  /**
   * Reads job.status through a function boundary so TS doesn't narrow
   * it to the literal type assigned before the preceding await.
   */
  private static readStatus(job: ScheduledJob): ScheduledJob['status'] {
    return job.status;
  }

  private scheduleNextCron(job: ScheduledJob): void {
    if (job.status === 'stopped') return;

    try {
      const nextRun = this.parseCronAndGetNextFireTime(job.expression!);
      job.nextRun = nextRun;
      
      const now = Date.now();
      let delay = nextRun.getTime() - now;
      if (delay < 0) { delay = 0; }

      job.handle = setTimeout(() => {
        void this.executeJob(job);
      }, delay);
      job.status = 'idle';
    } catch (error) {
      console.error(`Error scheduling cron job ${job.name}:`, error);
      job.status = 'stopped';
    }
  }

  private parseCronAndGetNextFireTime(expression: string): Date {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: ${expression}`);
    }

    const [minute, hour, day, month, weekday] = parts;
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1);

    const maxYear = now.getFullYear() + 5;

    while (now.getFullYear() < maxYear) {
      if (!this.matchField(month, now.getMonth() + 1, 1, 12)) {
        now.setMonth(now.getMonth() + 1, 1);
        now.setHours(0, 0, 0, 0);
        continue;
      }
      
      if (!this.matchField(day, now.getDate(), 1, 31) || !this.matchField(weekday, now.getDay(), 0, 6)) {
        now.setDate(now.getDate() + 1);
        now.setHours(0, 0, 0, 0);
        continue;
      }
      
      if (!this.matchField(hour, now.getHours(), 0, 23)) {
        now.setHours(now.getHours() + 1, 0, 0, 0);
        continue;
      }
      
      if (!this.matchField(minute, now.getMinutes(), 0, 59)) {
        now.setMinutes(now.getMinutes() + 1);
        continue;
      }

      return new Date(now);
    }
    
    throw new Error('Could not find next execution time for cron expression');
  }

  private matchField(field: string, value: number, min: number, max: number): boolean {
    if (field === '*') return true;
    
    const parts = field.split(',');
    for (const part of parts) {
      if (this.matchPart(part, value, min, max)) {
        return true;
      }
    }
    return false;
  }

  private matchPart(part: string, value: number, min: number, max: number): boolean {
    const stepMatch = part.match(/(.*)\/(\d+)/);
    let step = 1;
    let range = part;
    
    if (stepMatch) {
      range = stepMatch[1];
      step = parseInt(stepMatch[2], 10);
    }

    if (range === '*') {
      return (value - min) % step === 0;
    }

    const rangeMatch = range.match(/(\d+)-(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      return value >= start && value <= end && (value - start) % step === 0;
    }

    const exact = parseInt(range, 10);
    return value === exact;
  }
}
