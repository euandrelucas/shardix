import { HttpServer } from '@shardix/http';
import { createServer } from 'node:http';
import type { Server } from 'node:http';

export interface DashboardApiOptions {
  port?: number;
  token?: string;
}


export interface LiveMetricsSnapshot {
  timestamp: string;
  uptime: number;
  cpuUsagePercent: number;
  memoryHeapUsedMB: number;
  memoryRssMB: number;
  eventLoopDelayMs: number;
  interactionsTotal: number;
  interactionsPerSec: number;
  commandsTotal: number;
  commandsPerSec: number;
  eventsTotal: number;
  errorsTotal: number;
  errorsPerSec: number;
  avgCommandDurationMs: number;
  p95CommandDurationMs: number;
  gatewayPingMs: number;
  gatewayStatus: 'connected' | 'disconnected' | 'unknown';
  cacheHitRatio: number;
  activeTraces: number;
}

export interface CommandMetric {
  name: string;
  executions: number;
  avgMs: number;
  p95Ms: number;
  errors: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  data?: Record<string, unknown>;
}

class MetricsRegistry {
  private metrics: LiveMetricsSnapshot = this.defaultMetrics();
  private commands: Map<string, CommandMetric> = new Map();
  private logs: LogEntry[] = [];
  private wsClients: Set<any> = new Set();

  private defaultMetrics(): LiveMetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cpuUsagePercent: 0,
      memoryHeapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      memoryRssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      eventLoopDelayMs: 0,
      interactionsTotal: 0,
      interactionsPerSec: 0,
      commandsTotal: 0,
      commandsPerSec: 0,
      eventsTotal: 0,
      errorsTotal: 0,
      errorsPerSec: 0,
      avgCommandDurationMs: 0,
      p95CommandDurationMs: 0,
      gatewayPingMs: 0,
      gatewayStatus: 'unknown',
      cacheHitRatio: 0,
      activeTraces: 0,
    };
  }

  /** Called by ObservabilityProvider to update live metrics */
  public pushMetrics(metrics: Partial<LiveMetricsSnapshot>): void {
    this.metrics = {
      ...this.metrics,
      ...metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryRssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      memoryHeapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
    // Broadcast to WebSocket clients
    this.broadcastToWs({ type: 'metrics', data: this.metrics });
  }

  /** Called by command handlers to record command stats */
  public recordCommand(name: string, durationMs: number, isError = false): void {
    const existing = this.commands.get(name) ?? {
      name, executions: 0, avgMs: 0, p95Ms: 0, errors: 0,
    };
    existing.executions++;
    existing.avgMs = (existing.avgMs * (existing.executions - 1) + durationMs) / existing.executions;
    if (isError) existing.errors++;
    this.commands.set(name, existing);
  }

  /** Add a log entry (ring buffer, max 500) */
  public addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.broadcastToWs({ type: 'log', data: entry });
  }

  public getMetrics(): LiveMetricsSnapshot {
    return { ...this.metrics, uptime: process.uptime() };
  }

  public getCommands(): CommandMetric[] {
    return [...this.commands.values()].sort((a, b) => b.executions - a.executions);
  }

  public getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  public addWsClient(client: any): void {
    this.wsClients.add(client);
  }

  public removeWsClient(client: any): void {
    this.wsClients.delete(client);
  }

  private broadcastToWs(message: unknown): void {
    const payload = JSON.stringify(message);
    for (const client of this.wsClients) {
      try {
        if (client.readyState === 1 /* OPEN */) {
          client.send(payload);
        }
      } catch {
        this.wsClients.delete(client);
      }
    }
  }
}

/** Global metrics registry — providers push data here */
export const metricsRegistry = new MetricsRegistry();


class MetricsWebSocketServer {
  private wss: any = null;
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;

  async start(port: number): Promise<void> {
    try {
      const { WebSocketServer } = await import('ws' as any);
      this.wss = new WebSocketServer({ port });

      this.wss.on('connection', (ws: any) => {
        metricsRegistry.addWsClient(ws);
        // Send current metrics immediately on connect
        ws.send(JSON.stringify({ type: 'metrics', data: metricsRegistry.getMetrics() }));

        ws.on('close', () => metricsRegistry.removeWsClient(ws));
        ws.on('error', () => metricsRegistry.removeWsClient(ws));
      });

      // Broadcast live metrics every second
      this.broadcastInterval = setInterval(() => {
        metricsRegistry.pushMetrics({});
      }, 1000);

      console.log(`[Shardix Dashboard] WebSocket metrics server on ws://localhost:${port}`);
    } catch {
      // ws package not installed — skip WebSocket server silently
    }
  }

  async stop(): Promise<void> {
    if (this.broadcastInterval) clearInterval(this.broadcastInterval);
    if (this.wss) this.wss.close();
  }
}


export class DashboardApiServer {
  private server: HttpServer;
  private token: string;
  private wsServer = new MetricsWebSocketServer();
  private startTime = Date.now();

  constructor(options: DashboardApiOptions = {}) {
    this.token = options.token || process.env.SHARDIX_DASHBOARD_TOKEN || 'shardix_secret_token';
    this.server = new HttpServer({ port: options.port || 3005 });
    this.registerEndpoints();
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  private registerEndpoints(): void {
    const fastify = this.server.getFastify();

    // CORS headers
    fastify.addHook('onSend', async (request, reply, payload) => {
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      return payload;
    });

    fastify.options('*', async (request, reply) => {
      reply.status(200).send();
    });

    // Authentication middleware — skip for public routes
    fastify.addHook('onRequest', async (request, reply) => {
      if (request.method === 'OPTIONS') return;
      if (request.url === '/' || request.url.startsWith('/dashboard') || request.url === '/ping') return;

      const authHeader = request.headers.authorization;
      const queryToken = (request.query as any)?.token;
      const providedToken = authHeader?.replace('Bearer ', '').trim() || queryToken;

      if (!providedToken || !this.timingSafeEqual(providedToken, this.token)) {
        reply.status(401).send({ error: 'Unauthorized: Invalid Shardix Dashboard Token' });
        return;
      }
    });


    fastify.get('/ping', async () => ({ pong: true, uptime: process.uptime() }));


    fastify.get('/api/application', async () => {
      let version = '0.9.0';
      try { version = require('../../core/package.json').version; } catch {}
      return {
        name: process.env.npm_package_name || 'Shardix Application',
        version,
        shardixVersion: '0.9.0',
        status: 'ONLINE',
        uptime: Math.floor(process.uptime()),
        startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      };
    });


    fastify.get('/api/metrics/live', async () => metricsRegistry.getMetrics());

    fastify.get('/api/metrics/commands', async () => ({
      commands: metricsRegistry.getCommands(),
      totalExecutions: metricsRegistry.getCommands().reduce((s, c) => s + c.executions, 0),
    }));


    fastify.get('/api/runtime', async () => ({
      runtime: 'GatewayRuntime',
      adapter: process.env.SHARDIX_ADAPTER || 'DiscordJSAdapter',
      transports: ['GatewayWebSocket'],
      status: 'ONLINE',
      restLatencyMs: 0,
      gatewayLatencyMs: metricsRegistry.getMetrics().gatewayPingMs,
    }));


    fastify.get('/api/workers', async () => [
      {
        id: `worker_${process.pid}`,
        status: 'healthy',
        memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
      },
    ]);

    fastify.get('/api/cluster', async () => ({
      mode: 'standalone',
      workers: 1,
      shards: 'auto',
    }));


    fastify.get('/api/health', async () => {
      const mem = process.memoryUsage();
      const heapMB = mem.heapUsed / 1024 / 1024;
      return {
        status: heapMB > 1024 ? 'fail' : heapMB > 512 ? 'warn' : 'pass',
        uptime: Math.floor(process.uptime()),
        checks: {
          process: [{ componentName: 'process', status: 'pass', observedValue: Math.floor(process.uptime()), observedUnit: 's' }],
          memory: [{ componentName: 'memory', status: heapMB > 512 ? 'warn' : 'pass', observedValue: Math.round(heapMB), observedUnit: 'MB' }],
        },
      };
    });


    fastify.get('/api/events', async () => ({
      eventsTotal: metricsRegistry.getMetrics().eventsTotal,
      recentEvents: [],
    }));


    fastify.get('/api/logs', async (req) => {
      const limit = parseInt((req.query as any)?.limit ?? '100');
      const level = (req.query as any)?.level;
      let logs = metricsRegistry.getLogs(limit);
      if (level) logs = logs.filter((l) => l.level === level);
      return logs;
    });


    fastify.get('/api/providers', async () => [
      { name: 'HealthProvider', status: 'active', version: '0.9.0' },
      { name: 'ObservabilityProvider', status: 'active', version: '0.9.0' },
      { name: 'SchedulerProvider', status: 'active', version: '0.9.0' },
      { name: 'QueueProvider', status: 'active', version: '0.9.0' },
    ]);


    fastify.get('/api/cache', async () => ({
      hitRatio: metricsRegistry.getMetrics().cacheHitRatio,
      hits: metricsRegistry.getMetrics().cacheHitRatio * 1000,
      misses: (1 - metricsRegistry.getMetrics().cacheHitRatio) * 1000,
      driver: 'memory',
    }));

    fastify.get('/', async (request, reply) => {
      // Try to serve the dashboard-web index.html
      const { existsSync, readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const dashboardHtmlPaths = [
        join(__dirname, '../../dashboard-web/index.html'),
        join(process.cwd(), 'node_modules/@shardix/dashboard-web/index.html'),
      ];
      for (const p of dashboardHtmlPaths) {
        if (existsSync(p)) {
          return reply.type('text/html').send(readFileSync(p, 'utf-8'));
        }
      }
      return reply.type('text/html').send(this.renderMinimalDashboard());
    });
  }

  private renderMinimalDashboard(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shardix Dashboard v0.9</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e2e8f0; margin: 0; padding: 2rem; min-height: 100vh; }
    .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem; }
    .logo { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #5865f2, #eb459e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge { background: #5865f2; color: #fff; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #111118; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; transition: border-color 0.2s; }
    .card:hover { border-color: #5865f2; }
    .card-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .card-value { font-size: 2rem; font-weight: 700; font-family: 'JetBrains Mono', 'Courier New', monospace; }
    .online { color: #23d18b; } .warn { color: #f1c232; } .error { color: #e74c3c; }
    .api-endpoints { background: #111118; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
    code { background: #0a0a0f; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #38bdf8; }
    a { color: #5865f2; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #23d18b; display: inline-block; margin-right: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">⚡ Shardix</div>
    <span class="badge">v0.9 Dashboard</span>
    <span style="margin-left: auto; font-size: 0.85rem; color: #64748b;">
      <span class="status-dot"></span>API Online — Port 3005
    </span>
  </div>
  <div class="grid" id="metrics">
    <div class="card"><div class="card-label">Status</div><div class="card-value online">ONLINE</div></div>
    <div class="card"><div class="card-label">Uptime</div><div class="card-value" id="uptime">—</div></div>
    <div class="card"><div class="card-label">Memory RSS</div><div class="card-value" id="rss">—</div></div>
    <div class="card"><div class="card-label">Heap Used</div><div class="card-value" id="heap">—</div></div>
    <div class="card"><div class="card-label">Interactions/s</div><div class="card-value" id="ips">—</div></div>
    <div class="card"><div class="card-label">Gateway Ping</div><div class="card-value" id="ping">—</div></div>
  </div>
  <div class="api-endpoints">
    <h3 style="margin: 0 0 1rem; font-size: 0.9rem; color: #94a3b8;">REST API Endpoints</h3>
    <div style="display: grid; gap: 0.5rem; font-size: 0.82rem;">
      <div><code>GET /api/application</code> — Application overview</div>
      <div><code>GET /api/metrics/live</code> — Live metrics snapshot</div>
      <div><code>GET /api/metrics/commands</code> — Command performance data</div>
      <div><code>GET /api/runtime</code> — Runtime information</div>
      <div><code>GET /api/health</code> — Health check status</div>
      <div><code>GET /api/logs?limit=100&level=info</code> — Structured logs</div>
      <div><code>GET /api/workers</code> — Worker processes</div>
      <div><code>GET /api/cache</code> — Cache statistics</div>
    </div>
    <p style="margin-top: 1rem; font-size: 0.78rem; color: #64748b;">
      Install <code>@shardix/dashboard-web</code> for the full interactive dashboard UI. <br/>
      Authenticate with: <code>Authorization: Bearer ${this.token}</code>
    </p>
  </div>
  <script>
    async function refresh() {
      try {
        const res = await fetch('/api/metrics/live', { headers: { Authorization: 'Bearer shardix_secret_token' } });
        if (!res.ok) return;
        const m = await res.json();
        document.getElementById('uptime').textContent = formatUptime(m.uptime || 0);
        document.getElementById('rss').textContent = (m.memoryRssMB || 0) + ' MB';
        document.getElementById('heap').textContent = (m.memoryHeapUsedMB || 0) + ' MB';
        document.getElementById('ips').textContent = (m.interactionsPerSec || 0).toFixed(1);
        document.getElementById('ping').textContent = (m.gatewayPingMs || 0) + ' ms';
      } catch {}
    }
    function formatUptime(s) {
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
      return d > 0 ? d + 'd ' + h + 'h' : h > 0 ? h + 'h ' + m + 'm' : m + 'm';
    }
    refresh();
    setInterval(refresh, 3000);
  </script>
</body>
</html>`;
  }

  public async start(): Promise<void> {
    await this.server.start();
    await this.wsServer.start(9090);
  }

  public async stop(): Promise<void> {
    await this.server.stop();
    await this.wsServer.stop();
  }
}

