import * as http from 'node:http';
import { ProviderContract } from '@shardix/common';

export type HealthStatus = 'pass' | 'warn' | 'fail';

export interface HealthCheckDetail {
  componentName: string;
  componentType?: 'datastore' | 'system' | 'internal' | 'external';
  status: HealthStatus;
  observedValue?: string | number;
  observedUnit?: string;
  output?: string;        // error message if failing
  time?: string;          // ISO timestamp of last check
  durationMs?: number;    // how long the check took
}

// RFC Health Check Response Format (https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check)
export interface HealthCheckResponse {
  status: HealthStatus;
  version?: string;
  releaseId?: string;
  serviceId?: string;
  description?: string;
  checks: Record<string, HealthCheckDetail[]>;
  output?: string;
  links?: Record<string, string>;
}

export interface HealthCheckDefinition {
  name: string;
  componentType?: HealthCheckDetail['componentType'];
  handler: () => Promise<HealthCheckDetail> | HealthCheckDetail;
  timeoutMs?: number;     // default: 5000
  critical?: boolean;     // if true, failure = overall fail (not warn)
}

export interface HealthServerOptions {
  port?: number;          // default: 8080
  host?: string;          // default: '0.0.0.0'
  path?: string;          // health path prefix, default: ''
  enabled?: boolean;      // default: true
}

export interface HealthProviderOptions {
  server?: HealthServerOptions;
  version?: string;        // app version for response
  description?: string;    // service description
}

export class HealthService {
  private checks: Map<string, HealthCheckDefinition> = new Map();
  private startTime: number = Date.now();
  private version?: string;
  private description?: string;

  constructor(options?: { version?: string; description?: string }) {
    this.version = options?.version;
    this.description = options?.description;
    
    // Pre-register built-in checks
    this.addCheck('memory', () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const status: HealthStatus = heapUsedMB > 512 ? 'warn' : 'pass';
      
      return {
        componentName: 'memory',
        componentType: 'system',
        status,
        observedValue: heapUsedMB.toFixed(2),
        observedUnit: 'MB',
        output: status === 'warn' ? 'High heap memory usage' : 'Memory usage OK'
      };
    });

    this.addCheck('uptime', () => {
      return {
        componentName: 'uptime',
        componentType: 'system',
        status: 'pass',
        observedValue: process.uptime(),
        observedUnit: 'seconds'
      };
    });
  }

  /**
   * Register a raw check definition.
   * @param definition Definition of the health check.
   */
  public register(definition: HealthCheckDefinition): void {
    this.checks.set(definition.name, definition);
  }

  /**
   * Convenience method to add a basic check.
   * @param name Name of the check.
   * @param fn Function returning true (pass) or false (fail).
   * @param options Additional options like timeout and critical.
   */
  public addCheck(
    name: string,
    fn: () => Promise<boolean | HealthCheckDetail> | boolean | HealthCheckDetail,
    options?: { timeoutMs?: number; critical?: boolean; componentType?: HealthCheckDetail['componentType'] }
  ): void {
    this.register({
      name,
      componentType: options?.componentType,
      timeoutMs: options?.timeoutMs,
      critical: options?.critical ?? true, // default to critical
      handler: async () => {
        const result = await fn();
        if (typeof result === 'boolean') {
          return {
            componentName: name,
            componentType: options?.componentType,
            status: result ? 'pass' : 'fail'
          };
        }
        return result;
      }
    });
  }

  /**
   * Run ALL checks with individual timeouts.
   */
  public async check(): Promise<HealthCheckResponse> {
    let overallStatus: HealthStatus = 'pass';
    const checkResults: Record<string, HealthCheckDetail[]> = {};

    const promises = Array.from(this.checks.values()).map(async (def) => {
      const timeoutMs = def.timeoutMs ?? 5000;
      const startTime = Date.now();
      let resultDetail: HealthCheckDetail;

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
        });

        const rawResult = await Promise.race([
          Promise.resolve(def.handler()),
          timeoutPromise
        ]);
        
        resultDetail = rawResult as HealthCheckDetail;
      } catch (error: any) {
        resultDetail = {
          componentName: def.name,
          componentType: def.componentType,
          status: 'fail',
          output: error?.message || 'Check failed'
        };
      }

      resultDetail.time = new Date().toISOString();
      resultDetail.durationMs = Date.now() - startTime;

      if (!checkResults[def.name]) {
        checkResults[def.name] = [];
      }
      checkResults[def.name].push(resultDetail);

      if (resultDetail.status === 'fail') {
        if (def.critical !== false) {
          overallStatus = 'fail';
        } else if (overallStatus === 'pass') {
          overallStatus = 'warn';
        }
      } else if (resultDetail.status === 'warn' && overallStatus === 'pass') {
        overallStatus = 'warn';
      }
    });

    await Promise.allSettled(promises);

    return {
      status: overallStatus,
      version: this.version,
      description: this.description,
      checks: checkResults
    };
  }

  /**
   * Are all critical checks passing?
   */
  public async isReady(): Promise<boolean> {
    const response = await this.check();
    return response.status !== 'fail';
  }

  /**
   * Process is alive (always true while running).
   */
  public isLive(): boolean {
    return true;
  }

  /**
   * Generate Prometheus metrics in text format.
   */
  public async getPrometheusMetrics(): Promise<string> {
    const lines: string[] = [];
    const response = await this.check();
    
    lines.push('# HELP shardix_health_check_up Is the health check passing (1) or failing (0)');
    lines.push('# TYPE shardix_health_check_up gauge');
    for (const [name, details] of Object.entries(response.checks)) {
      const isUp = details.some(d => d.status !== 'fail') ? 1 : 0;
      lines.push(`shardix_health_check_up{name="${name}"} ${isUp}`);
    }

    lines.push('# HELP shardix_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE shardix_uptime_seconds counter');
    lines.push(`shardix_uptime_seconds ${Math.floor(process.uptime())}`);

    const memUsage = process.memoryUsage();
    lines.push('# HELP shardix_memory_heap_bytes Heap memory used in bytes');
    lines.push('# TYPE shardix_memory_heap_bytes gauge');
    lines.push(`shardix_memory_heap_bytes ${memUsage.heapUsed}`);

    lines.push('# HELP shardix_memory_rss_bytes RSS memory in bytes');
    lines.push('# TYPE shardix_memory_rss_bytes gauge');
    lines.push(`shardix_memory_rss_bytes ${memUsage.rss}`);

    return lines.join('\n') + '\n';
  }
}

export class HealthHttpServer {
  private server?: http.Server;

  constructor(private service: HealthService, private options: HealthServerOptions) {}

  /**
   * Starts the HTTP server.
   */
  public start(): Promise<void> {
    if (this.options.enabled === false) {
      return Promise.resolve();
    }
    
    const port = this.options.port ?? 8080;
    const host = this.options.host ?? '0.0.0.0';
    const prefix = this.options.path ?? '';

    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // CORS Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method !== 'GET') {
          res.writeHead(405, { 'Content-Type': 'text/plain' });
          res.end('Method Not Allowed');
          return;
        }

        const url = req.url || '/';
        const normalizedPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
        
        try {
          if (url === `${normalizedPrefix}/health` || url === `${normalizedPrefix}/health/`) {
            const health = await this.service.check();
            const statusCode = health.status === 'fail' ? 503 : 200;
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(health));
          } else if (url === `${normalizedPrefix}/ready` || url === `${normalizedPrefix}/ready/`) {
            const ready = await this.service.isReady();
            const statusCode = ready ? 200 : 503;
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ready }));
          } else if (url === `${normalizedPrefix}/live` || url === `${normalizedPrefix}/live/`) {
            const live = this.service.isLive();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ live, pid: process.pid, uptime: process.uptime() }));
          } else if (url === `${normalizedPrefix}/metrics` || url === `${normalizedPrefix}/metrics/`) {
            const metrics = await this.service.getPrometheusMetrics();
            res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
            res.end(metrics);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      });

      this.server.on('error', reject);

      this.server.listen(port, host, () => {
        resolve();
      });
    });
  }

  /**
   * Graceful shutdown of the HTTP server.
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

export class HealthProvider implements ProviderContract {
  public readonly name = 'HealthProvider';
  public readonly version = '0.9.0';
  
  private service: HealthService;
  private httpServer?: HealthHttpServer;

  constructor(private options: HealthProviderOptions = {}) {
    this.service = new HealthService({
      version: options.version,
      description: options.description
    });
    
    if (options.server?.enabled !== false) {
      this.httpServer = new HealthHttpServer(this.service, options.server || {});
    }
  }
  
  /**
   * Registers HealthService in DI.
   */
  public async register(app: any): Promise<void> {
    if (app && typeof app.getContainer === 'function') {
      const container = app.getContainer();
      container.register({ provide: HealthProvider, useValue: this });
      container.register({ provide: HealthService, useValue: this.service });
    }
  }

  /**
   * Starts HealthHttpServer.
   */
  public async boot(): Promise<void> {
    if (this.httpServer) {
      await this.httpServer.start();
    }
  }
  
  /**
   * Stops server.
   */
  public async shutdown(): Promise<void> {
    if (this.httpServer) {
      await this.httpServer.stop();
    }
  }
  
  /**
   * Fluent API for quick setup of checks.
   */
  public addCheck(
    name: string,
    fn: () => Promise<boolean | HealthCheckDetail> | boolean | HealthCheckDetail,
    options?: { timeoutMs?: number; critical?: boolean; componentType?: HealthCheckDetail['componentType'] }
  ): this {
    this.service.addCheck(name, fn, options);
    return this;
  }
}

/**
 * Convenience function to create a HealthProvider.
 */
export function createHealthProvider(options?: HealthProviderOptions): HealthProvider {
  return new HealthProvider(options);
}
