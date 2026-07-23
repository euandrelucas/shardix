import { Injectable } from '@shardix/common';

@Injectable()
export class AuditLoggerService {
  logAction(action: string, targetUser: string, executor: string) {
    console.log(`[AUDIT LOG] ${executor} executed ${action} on ${targetUser}`);
  }
}

@Injectable()
export class ModerationService {
  constructor(private auditLogger: AuditLoggerService) {}

  banUser(userId: string, executor: string): string {
    this.auditLogger.logAction('BAN', userId, executor);
    return `User ${userId} has been banned by ${executor}.`;
  }

  kickUser(userId: string, executor: string): string {
    this.auditLogger.logAction('KICK', userId, executor);
    return `User ${userId} has been kicked by ${executor}.`;
  }

  timeoutUser(userId: string, durationMinutes: number, executor: string): string {
    this.auditLogger.logAction(`TIMEOUT (${durationMinutes}m)`, userId, executor);
    return `User ${userId} has been timed out for ${durationMinutes} minutes.`;
  }

  purgeMessages(amount: number, executor: string): string {
    this.auditLogger.logAction(`PURGE (${amount} msgs)`, 'CHANNEL', executor);
    return `Purged ${amount} messages.`;
  }

  setSlowmode(seconds: number, executor: string): string {
    this.auditLogger.logAction(`SLOWMODE (${seconds}s)`, 'CHANNEL', executor);
    return `Channel slowmode set to ${seconds} seconds.`;
  }

  lockChannel(executor: string): string {
    this.auditLogger.logAction('LOCK_CHANNEL', 'CHANNEL', executor);
    return 'Channel has been locked down.';
  }
}
