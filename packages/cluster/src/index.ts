export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  memoryUsage: number;
  uptime: number;
}

export interface WorkerNode {
  readonly id: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<HealthStatus>;
}

export class MockWorkerNode implements WorkerNode {
  private isRunning = false;
  private startTime = Date.now();

  constructor(public readonly id: string) {}

  public async start(): Promise<void> {
    this.isRunning = true;
    this.startTime = Date.now();
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
  }

  public async health(): Promise<HealthStatus> {
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      memoryUsage: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}

export class ClusterManager {
  private workerMap = new Map<string, WorkerNode>();

  public workers(count: number): this {
    for (let i = 0; i < count; i++) {
      const id = `worker_${i + 1}`;
      if (!this.workerMap.has(id)) {
        this.workerMap.set(id, new MockWorkerNode(id));
      }
    }
    return this;
  }

  public async startAll(): Promise<void> {
    for (const worker of this.workerMap.values()) {
      await worker.start();
    }
  }

  public async stopAll(): Promise<void> {
    for (const worker of this.workerMap.values()) {
      await worker.stop();
    }
  }

  public getWorkerList(): WorkerNode[] {
    return Array.from(this.workerMap.values());
  }

  public getWorker(id: string): WorkerNode | undefined {
    return this.workerMap.get(id);
  }
}
