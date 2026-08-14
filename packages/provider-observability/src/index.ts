import { randomUUID } from 'node:crypto';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import * as util from 'node:util';
import { ProviderContract } from '@shardix/common';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface LiveMetrics {
  // System
  timestamp: string;             // ISO timestamp
  uptimeSeconds: number;
  cpuUsagePercent: number;       // via process.cpuUsage()
  memoryHeapUsedMB: number;
  memoryHeapTotalMB: number;
  memoryRssMB: number;
  memoryExternalMB: number;
  eventLoopDelayMs: number;      // via monitorEventLoopDelay()
  activeHandles: number;         // process._getActiveHandles().length
  activeRequests: number;        // process._getActiveRequests().length

  // Discord / Shardix
  interactionsTotal: number;     // cumulative
  interactionsPerSec: number;    // sliding 1s window
  commandsTotal: number;
  commandsPerSec: number;
  eventsTotal: number;
  eventsPerSec: number;
  errorsTotal: number;
  errorsPerSec: number;
  avgCommandDurationMs: number;  // rolling average
  p95CommandDurationMs: number;  // approximate p95
  
  // Gateway (if adapter provides it)
  gatewayPingMs: number;
  gatewayStatus: 'connected' | 'disconnected' | 'unknown';
  
  // Cache (if available)
  cacheHitRatio: number;
  cacheHits: number;
  cacheMisses: number;
  
  // Request tracing
  activeTraces: number;
}

export interface TraceSpan {
  spanId: string;
  traceId: string;
  correlationId?: string;
  operationName: string;
  startTime: number;
  duration?: number;
  status: 'active' | 'completed' | 'error';
  attributes: Record<string, string | number | boolean>;
  error?: string;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  spanId?: string;
  traceId?: string;
  correlationId?: string;
  data?: Record<string, unknown>;
  error?: { message: string; stack?: string; name: string };
}

export interface MetricsWindow {
  samples: number[];
  windowSizeMs: number;
  lastReset: number;
}

export interface ObservabilityOptions {
  collectIntervalMs?: number;   // default: 1000
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  prettyLogs?: boolean;         // default: false
  wsMetrics?: {
    enabled: boolean;
    port: number;              // default: 9090
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

class SlidingRateCounter {
  private counts: number[] = [];
  private timestamps: number[] = [];
  private readonly windowMs = 1000;

  public add(count: number = 1) {
    const now = performance.now();
    this.counts.push(count);
    this.timestamps.push(now);
    this.cleanup(now);
  }

  public getRate(): number {
    const now = performance.now();
    this.cleanup(now);
    return this.counts.reduce((a, b) => a + b, 0);
  }

  private cleanup(now: number) {
    const threshold = now - this.windowMs;
    let removeCount = 0;
    while (removeCount < this.timestamps.length && this.timestamps[removeCount] <= threshold) {
      removeCount++;
    }
    if (removeCount > 0) {
      this.counts.splice(0, removeCount);
      this.timestamps.splice(0, removeCount);
    }
  }
}

class RingBuffer {
  private buffer: number[];
  private head = 0;
  private count = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(value: number) {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  getAverage(): number {
    if (this.count === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.count; i++) {
      sum += this.buffer[i];
    }
    return sum / this.count;
  }

  getP95(): number {
    if (this.count === 0) return 0;
    const sorted = this.buffer.slice(0, this.count).sort((a, b) => a - b);
    const index = Math.floor(this.count * 0.95);
    return sorted[index];
  }
}

// -----------------------------------------------------------------------------
// Core Observability Classes
// -----------------------------------------------------------------------------

/**
 * Public API for recording metrics within the framework.
 */
export class MetricsRecorder {
  // Counters
  public interactionsTotal = 0;
  public commandsTotal = 0;
  public eventsTotal = 0;
  public errorsTotal = 0;
  public cacheHits = 0;
  public cacheMisses = 0;

  // Rates
  public interactionsRate = new SlidingRateCounter();
  public commandsRate = new SlidingRateCounter();
  public eventsRate = new SlidingRateCounter();
  public errorsRate = new SlidingRateCounter();

  // Durations
  public commandDurations = new RingBuffer(1000);

  // Gateway
  public gatewayPingMs = 0;
  public gatewayStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';

  /**
   * Records an interaction.
   */
  public recordInteraction(durationMs?: number): void {
    this.interactionsTotal++;
    this.interactionsRate.add(1);
    if (durationMs !== undefined) {
      this.commandDurations.push(durationMs);
    }
  }

  /**
   * Records a command execution.
   */
  public recordCommand(name: string, durationMs: number, error?: Error): void {
    this.commandsTotal++;
    this.commandsRate.add(1);
    this.commandDurations.push(durationMs);
    if (error) {
      this.recordError(error, `command:${name}`);
    }
  }

  /**
   * Records a generic event.
   */
  public recordEvent(name: string): void {
    this.eventsTotal++;
    this.eventsRate.add(1);
  }

  /**
   * Records an error.
   */
  public recordError(error: Error, context?: string): void {
    this.errorsTotal++;
    this.errorsRate.add(1);
  }

  /**
   * Records a cache hit.
   */
  public recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Records a cache miss.
   */
  public recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Updates the latest gateway ping latency.
   */
  public updateGatewayPing(ms: number): void {
    this.gatewayPingMs = ms;
  }

  /**
   * Updates the gateway connection status.
   */
  public updateGatewayStatus(status: 'connected' | 'disconnected'): void {
    this.gatewayStatus = status;
  }
}

/**
 * Collects system metrics at regular intervals.
 */
export class MetricsCollector {
  private timer?: NodeJS.Timeout;
  private lastCpuUsage?: NodeJS.CpuUsage;
  private lastCpuTime?: number;
  private currentCpuPercent = 0;
  private eventLoopHistogram = monitorEventLoopDelay({ resolution: 20 });
  
  constructor(
    private readonly intervalMs: number,
    private readonly recorder: MetricsRecorder,
    private readonly tracer: Tracer
  ) {}

  /**
   * Starts collecting system metrics on an interval.
   */
  public start(): void {
    if (this.timer) return;
    this.eventLoopHistogram.enable();
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuTime = performance.now();
    
    this.timer = setInterval(() => {
      this.updateCpuUsage();
    }, this.intervalMs);
    this.timer.unref();
  }

  /**
   * Stops collecting system metrics.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.eventLoopHistogram.disable();
  }

  private updateCpuUsage(): void {
    if (!this.lastCpuUsage || !this.lastCpuTime) return;
    
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const currentTime = performance.now();
    const elapsedTimeMs = currentTime - this.lastCpuTime;
    
    // CPU usage is in microseconds
    const totalCpuTimeMs = (currentUsage.user + currentUsage.system) / 1000;
    
    // Percentage can be > 100% on multi-core
    this.currentCpuPercent = (totalCpuTimeMs / elapsedTimeMs) * 100;
    
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuTime = currentTime;
  }

  /**
   * Returns a complete snapshot of current metrics.
   */
  public getCurrentMetrics(): LiveMetrics {
    const mem = process.memoryUsage();
    const cacheTotal = this.recorder.cacheHits + this.recorder.cacheMisses;
    
    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      cpuUsagePercent: this.currentCpuPercent,
      memoryHeapUsedMB: mem.heapUsed / 1024 / 1024,
      memoryHeapTotalMB: mem.heapTotal / 1024 / 1024,
      memoryRssMB: mem.rss / 1024 / 1024,
      memoryExternalMB: mem.external / 1024 / 1024,
      eventLoopDelayMs: this.eventLoopHistogram.mean / 1e6, // nanoseconds to ms
      activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
      activeRequests: (process as any)._getActiveRequests?.()?.length || 0,

      interactionsTotal: this.recorder.interactionsTotal,
      interactionsPerSec: this.recorder.interactionsRate.getRate(),
      commandsTotal: this.recorder.commandsTotal,
      commandsPerSec: this.recorder.commandsRate.getRate(),
      eventsTotal: this.recorder.eventsTotal,
      eventsPerSec: this.recorder.eventsRate.getRate(),
      errorsTotal: this.recorder.errorsTotal,
      errorsPerSec: this.recorder.errorsRate.getRate(),
      
      avgCommandDurationMs: this.recorder.commandDurations.getAverage(),
      p95CommandDurationMs: this.recorder.commandDurations.getP95(),

      gatewayPingMs: this.recorder.gatewayPingMs,
      gatewayStatus: this.recorder.gatewayStatus,

      cacheHitRatio: cacheTotal > 0 ? this.recorder.cacheHits / cacheTotal : 0,
      cacheHits: this.recorder.cacheHits,
      cacheMisses: this.recorder.cacheMisses,

      activeTraces: this.tracer.getActiveSpans().length,
    };
  }
}

/**
 * Lightweight request tracer for recording span operations.
 */
export class Tracer {
  private activeSpans = new Map<string, TraceSpan>();
  private completedSpans: TraceSpan[] = [];
  private readonly maxCompletedSpans = 1000;
  
  /**
   * Starts a new span.
   */
  public startSpan(operationName: string, attributes?: Record<string, any>, correlationId?: string): TraceSpan {
    const span: TraceSpan = {
      spanId: randomUUID(),
      traceId: randomUUID(),
      correlationId,
      operationName,
      startTime: performance.now(),
      status: 'active',
      attributes: attributes || {},
    };
    
    this.activeSpans.set(span.spanId, span);
    
    // Auto-expire after 30s to prevent memory leaks
    setTimeout(() => {
      if (this.activeSpans.has(span.spanId)) {
        this.finishSpan(span.spanId, new Error('Span expired (30s timeout)'));
      }
    }, 30000).unref();
    
    return span;
  }

  /**
   * Finishes an active span.
   */
  public finishSpan(spanId: string, error?: Error): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;
    
    this.activeSpans.delete(spanId);
    
    span.duration = performance.now() - span.startTime;
    span.status = error ? 'error' : 'completed';
    if (error) {
      span.error = error.message;
    }
    
    this.completedSpans.push(span);
    if (this.completedSpans.length > this.maxCompletedSpans) {
      this.completedSpans.shift(); // Naive ring buffer for arrays, fine for 1000 items
    }
  }

  /**
   * Returns all currently active spans.
   */
  public getActiveSpans(): TraceSpan[] {
    return Array.from(this.activeSpans.values());
  }

  /**
   * Returns a limited list of completed spans.
   */
  public getCompletedSpans(limit: number = 100): TraceSpan[] {
    return this.completedSpans.slice(-limit);
  }
}

/**
 * Structured logger with support for JSON and pretty output formats.
 */
export class StructuredLogger {
  private readonly levels = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };
  private readonly pretty: boolean;
  private readonly currentLevel: number;
  private readonly output: NodeJS.WritableStream;
  private readonly baseAttributes: Record<string, string>;

  constructor(
    private options: { pretty?: boolean; level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'; output?: NodeJS.WritableStream },
    baseAttributes: Record<string, string> = {}
  ) {
    this.pretty = options.pretty ?? false;
    this.currentLevel = this.levels[options.level || 'info'] || 20;
    this.output = options.output || process.stdout;
    this.baseAttributes = baseAttributes;
  }

  /**
   * Creates a child logger with inherited attributes.
   */
  public child(attributes: Record<string, string>): StructuredLogger {
    return new StructuredLogger(this.options, { ...this.baseAttributes, ...attributes });
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error' | 'fatal', message: string, data?: Record<string, unknown>, error?: Error, span?: TraceSpan) {
    if (this.levels[level] < this.currentLevel) return;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.baseAttributes,
    };

    if (span) {
      entry.spanId = span.spanId;
      entry.traceId = span.traceId;
      entry.correlationId = span.correlationId;
    }

    if (data) entry.data = data;
    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    if (this.pretty) {
      const color = level === 'error' || level === 'fatal' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : level === 'debug' ? '\x1b[36m' : '\x1b[32m';
      const reset = '\x1b[0m';

      let out = `[${entry.timestamp}] ${color}${level.toUpperCase()}${reset}: ${message}`;
      if (entry.data || entry.spanId || entry.error) {
        const meta = { ...entry.data };
        if (entry.spanId) meta.spanId = entry.spanId;
        if (entry.error) meta.error = entry.error;
        out += `\n  ${util.inspect(meta, { colors: true, depth: null })}`;
      }
      this.output.write(out + '\n');
    } else {
      this.output.write(JSON.stringify(entry) + '\n');
    }
  }

  public debug(message: string, data?: Record<string, unknown>, span?: TraceSpan): void {
    this.log('debug', message, data, undefined, span);
  }
  
  public info(message: string, data?: Record<string, unknown>, span?: TraceSpan): void {
    this.log('info', message, data, undefined, span);
  }
  
  public warn(message: string, data?: Record<string, unknown>, span?: TraceSpan): void {
    this.log('warn', message, data, undefined, span);
  }
  
  public error(message: string, error?: Error, data?: Record<string, unknown>, span?: TraceSpan): void {
    this.log('error', message, data, error, span);
  }
  
  public fatal(message: string, error?: Error, data?: Record<string, unknown>, span?: TraceSpan): void {
    this.log('fatal', message, data, error, span);
  }
}

/**
 * Optional WebSocket server for real-time metrics streaming.
 */
export class MetricsWebSocketServer {
  private wsServer: any;
  private intervalTimer?: NodeJS.Timeout;

  constructor(private port: number, private collector: MetricsCollector, private logger: StructuredLogger) {}

  /**
   * Starts the WebSocket server if 'ws' is available.
   */
  public async start(): Promise<void> {
    try {
      const { WebSocketServer } = await import('ws');

      this.wsServer = new WebSocketServer({ port: this.port });
      this.logger.info(`Metrics WebSocket server started on port ${this.port}`);
      
      this.intervalTimer = setInterval(() => {
        if (!this.wsServer) return;
        const metrics = this.collector.getCurrentMetrics();
        const msg = JSON.stringify({ type: 'metrics', data: metrics });
        
        for (const client of this.wsServer.clients) {
          if (client.readyState === 1) { // OPEN
            client.send(msg);
          }
        }
      }, 1000);
      this.intervalTimer.unref();

      this.wsServer.on('error', (err: Error) => {
        this.logger.error('WebSocket server error', err);
      });

    } catch (error) {
      this.logger.warn('Failed to start MetricsWebSocketServer. "ws" package might not be installed.');
    }
  }

  /**
   * Stops the WebSocket server.
   */
  public async stop(): Promise<void> {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
    if (this.wsServer) {
      return new Promise((resolve) => {
        this.wsServer.close(() => resolve());
      });
    }
  }
}

/**
 * Provides observability capabilities (metrics, tracing, logging) for the Shardix framework.
 */
export class ObservabilityProvider implements ProviderContract {
  public readonly name = 'ObservabilityProvider';
  public readonly version = '0.9.0';
  
  private recorder: MetricsRecorder;
  private tracer: Tracer;
  private logger: StructuredLogger;
  private collector: MetricsCollector;
  private wsServer?: MetricsWebSocketServer;

  constructor(private options: ObservabilityOptions = {}) {
    this.recorder = new MetricsRecorder();
    this.tracer = new Tracer();
    
    this.logger = new StructuredLogger({
      pretty: options.prettyLogs ?? false,
      level: options.logLevel ?? 'info'
    });
    
    this.collector = new MetricsCollector(
      options.collectIntervalMs || 1000,
      this.recorder,
      this.tracer
    );

    if (options.wsMetrics?.enabled) {
      this.wsServer = new MetricsWebSocketServer(
        options.wsMetrics.port || 9090,
        this.collector,
        this.logger
      );
    }
  }

  public async register(app: any): Promise<void> {
    if (app && typeof app.getContainer === 'function') {
      const container = app.getContainer();
      container.register({ provide: ObservabilityProvider, useValue: this });
      container.register({ provide: MetricsRecorder, useValue: this.recorder });
      container.register({ provide: Tracer, useValue: this.tracer });
      container.register({ provide: StructuredLogger, useValue: this.logger });
    }
  }

  public async boot(): Promise<void> {
    this.collector.start();
    if (this.wsServer) {
      await this.wsServer.start();
    }
  }

  /**
   * Gets the current live metrics snapshot.
   */
  public getMetrics(): LiveMetrics {
    return this.collector.getCurrentMetrics();
  }

  /**
   * Returns the application tracer instance.
   */
  public getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Returns the application structured logger instance.
   */
  public getLogger(): StructuredLogger {
    return this.logger;
  }

  /**
   * Returns the application metrics recorder instance.
   */
  public getRecorder(): MetricsRecorder {
    return this.recorder;
  }
}

/**
 * Creates a new instance of the ObservabilityProvider.
 */
export function createObservabilityProvider(options?: ObservabilityOptions): ObservabilityProvider {
  return new ObservabilityProvider(options);
}
