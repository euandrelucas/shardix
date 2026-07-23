import fastify, { FastifyInstance } from 'fastify';
import { verifyDiscordSignature } from './verify-discord-signature.js';

export * from './verify-discord-signature.js';

export interface HttpOptions {
  port?: number;
  host?: string;
  publicKey?: string;
  endpoint?: string;
}

export class HttpServer {
  private app: FastifyInstance;
  private port: number;
  private host: string;
  private publicKey?: string;
  private endpoint: string;

  constructor(options: HttpOptions = {}) {
    this.port = options.port || 3000;
    this.host = options.host || '0.0.0.0';
    this.publicKey = options.publicKey;
    this.endpoint = options.endpoint || '/interactions';

    this.app = fastify({ logger: false });
  }

  public registerInteractionEndpoint(handler: (payload: any) => Promise<any>): void {
    this.app.post(this.endpoint, async (request, reply) => {
      if (this.publicKey) {
        const signature = request.headers['x-signature-ed25519'] as string;
        const timestamp = request.headers['x-signature-timestamp'] as string;
        const bodyStr = JSON.stringify(request.body);

        if (!signature || !timestamp || !verifyDiscordSignature(this.publicKey, signature, timestamp, bodyStr)) {
          return reply.status(401).send('Invalid request signature');
        }
      }

      const body = request.body as any;
      // Ping check (Type 1)
      if (body?.type === 1) {
        return reply.status(200).send({ type: 1 });
      }

      const response = await handler(body);
      return reply.status(200).send(response);
    });
  }

  public async start(): Promise<void> {
    await this.app.listen({ port: this.port, host: this.host });
  }

  public async stop(): Promise<void> {
    await this.app.close();
  }

  public getFastify(): FastifyInstance {
    return this.app;
  }
}
