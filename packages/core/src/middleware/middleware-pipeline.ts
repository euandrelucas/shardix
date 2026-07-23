export type MiddlewareFunction = (req: any, res: any, next: () => void | Promise<void>) => void | Promise<void>;

export class MiddlewarePipeline {
  private middlewares: MiddlewareFunction[] = [];

  public use(middleware: MiddlewareFunction): this {
    this.middlewares.push(middleware);
    return this;
  }

  public async execute(req: any, res: any, finalHandler: () => Promise<any>): Promise<any> {
    let index = 0;
    const next = async (): Promise<any> => {
      if (index < this.middlewares.length) {
        const mw = this.middlewares[index++];
        return await mw(req, res, next);
      } else {
        return await finalHandler();
      }
    };
    return await next();
  }
}
