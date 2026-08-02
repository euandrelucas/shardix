import Fastify, { FastifyInstance } from 'fastify';
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

    this.app = Fastify({ logger: false });

    // Add raw body capture for Discord signature verification
    this.app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
      try {
        const parsed = JSON.parse((body as Buffer).toString('utf8'));
        // Attach raw body string for signature verification
        (req as unknown as { rawBody?: string }).rawBody = (body as Buffer).toString('utf8');
        done(null, parsed);
      } catch (err) {
        done(err as Error, undefined);
      }
    });
  }

  public registerInteractionEndpoint(handler: (payload: unknown) => Promise<unknown>): void {
    this.app.post(this.endpoint, async (request, reply) => {
      if (this.publicKey) {
        const signature = request.headers['x-signature-ed25519'] as string;
        const timestamp = request.headers['x-signature-timestamp'] as string;
        // Use raw body string (captured before JSON parse) for signature verification
        const rawBody = (request as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(request.body);

        if (!signature || !timestamp || !verifyDiscordSignature(this.publicKey, signature, timestamp, rawBody)) {
          return reply.status(401).send('Invalid request signature');
        }
      }

      const body = request.body as Record<string, unknown>;
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
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HttpServer] Listening on ${this.host}:${this.port}`);
    }
  }

  public async stop(): Promise<void> {
    await this.app.close();
  }

  public getFastify(): FastifyInstance {
    return this.app;
  }
}
