import pino, { Logger as PinoInstance } from 'pino';
import { Injectable, Scope } from '@shardix/common';

export interface LoggerOptions {
  context?: string;
  pretty?: boolean;
}

@Injectable({ scope: Scope.TRANSIENT })
export class Logger {
  private pinoLogger: PinoInstance;
  private context: string;

  constructor(options: LoggerOptions = {}) {
    this.context = options.context || 'Shardix';
    this.pinoLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: options.pretty !== false ? { target: 'pino-pretty' } : undefined,
    });
  }

  public setContext(context: string): void {
    this.context = context;
  }

  public info(message: string, meta?: any): void {
    this.pinoLogger.info({ context: this.context, ...meta }, message);
  }

  public warn(message: string, meta?: any): void {
    this.pinoLogger.warn({ context: this.context, ...meta }, message);
  }

  public error(message: string, trace?: string, meta?: any): void {
    this.pinoLogger.error({ context: this.context, trace, ...meta }, message);
  }

  public debug(message: string, meta?: any): void {
    this.pinoLogger.debug({ context: this.context, ...meta }, message);
  }
}
