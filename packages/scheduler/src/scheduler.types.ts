import { CronOptions } from './decorators/cron.decorator';
import { IntervalOptions } from './decorators/interval.decorator';
import { TimeoutOptions } from './decorators/timeout.decorator';

export type JobType = 'cron' | 'interval' | 'timeout';

export interface ScheduledJob {
  name: string;
  type: JobType;
  expression?: string;
  intervalMs?: number;
  handler: () => Promise<void> | void;
  options: CronOptions | IntervalOptions | TimeoutOptions;
  handle?: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
  status: 'idle' | 'running' | 'stopped';
}

export interface SchedulerStats {
  totalJobs: number;
  runningJobs: number;
  stoppedJobs: number;
  totalExecutions: number;
  totalErrors: number;
}
