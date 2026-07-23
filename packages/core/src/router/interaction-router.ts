import 'reflect-metadata';
import {
  CommandContext,
  ExecutionContext,
  Guard,
  InteractionPayload,
  Interceptor,
  METADATA_KEYS,
  Pipe,
  Type,
} from '@shardix/common';
import { Container, ScopeContext } from '../di/container.js';

export interface RouteMatch {
  controllerInstance: any;
  methodName: string;
  guards: Type<Guard>[];
  pipes: Type<Pipe>[];
  interceptors: Type<Interceptor>[];
}

export class InteractionRouter {
  private slashCommands = new Map<string, RouteMatch>();
  private buttons = new Map<string | RegExp, RouteMatch>();
  private modals = new Map<string | RegExp, RouteMatch>();
  private autocompletes = new Map<string, RouteMatch>(); // commandName:optionName
  private selectMenus = new Map<string | RegExp, RouteMatch>();
  private eventHandlers = new Map<string, RouteMatch[]>();
  private rateLimits = new Map<string, { count: number; expiresAt: number }>();

  constructor(private container: Container) {}

  public registerController(controllerClass: Type<any>): void {
    const controllerInstance = this.container.get(controllerClass);
    const controllerGuards: Type<Guard>[] =
      Reflect.getMetadata(METADATA_KEYS.GUARDS, controllerClass) || [];
    const controllerPipes: Type<Pipe>[] =
      Reflect.getMetadata(METADATA_KEYS.PIPES, controllerClass) || [];
    const controllerInterceptors: Type<Interceptor>[] =
      Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, controllerClass) || [];

    // Slash Commands
    const slashCmds: any[] = Reflect.getMetadata(METADATA_KEYS.SLASH_COMMAND, controllerClass) || [];
    for (const item of slashCmds) {
      const methodGuards = Reflect.getMetadata(METADATA_KEYS.GUARDS, controllerClass, item.methodName) || [];
      const methodPipes = Reflect.getMetadata(METADATA_KEYS.PIPES, controllerClass, item.methodName) || [];
      const methodInterceptors = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, controllerClass, item.methodName) || [];

      this.slashCommands.set(item.options.name, {
        controllerInstance,
        methodName: item.methodName,
        guards: [...controllerGuards, ...methodGuards],
        pipes: [...controllerPipes, ...methodPipes],
        interceptors: [...controllerInterceptors, ...methodInterceptors],
      });
    }

    // Buttons
    const buttons: any[] = Reflect.getMetadata(METADATA_KEYS.BUTTON, controllerClass) || [];
    for (const item of buttons) {
      this.buttons.set(item.customId, {
        controllerInstance,
        methodName: item.methodName,
        guards: controllerGuards,
        pipes: controllerPipes,
        interceptors: controllerInterceptors,
      });
    }

    // Modals
    const modals: any[] = Reflect.getMetadata(METADATA_KEYS.MODAL, controllerClass) || [];
    for (const item of modals) {
      this.modals.set(item.customId, {
        controllerInstance,
        methodName: item.methodName,
        guards: controllerGuards,
        pipes: controllerPipes,
        interceptors: controllerInterceptors,
      });
    }

    // Events
    const events: any[] = Reflect.getMetadata(METADATA_KEYS.EVENT, controllerClass) || [];
    for (const item of events) {
      const match: RouteMatch = {
        controllerInstance,
        methodName: item.methodName,
        guards: controllerGuards,
        pipes: controllerPipes,
        interceptors: controllerInterceptors,
      };
      const list = this.eventHandlers.get(item.eventName) || [];
      list.push(match);
      this.eventHandlers.set(item.eventName, list);
    }
  }

  public async handleInteraction(payload: InteractionPayload): Promise<any> {
    let match: RouteMatch | undefined;

    // Type 2 = APPLICATION_COMMAND (SlashCommand)
    if (payload.type === 2 && payload.data?.name) {
      match = this.slashCommands.get(payload.data.name);
    }
    // Type 3 = MESSAGE_COMPONENT (Button or SelectMenu)
    else if (payload.type === 3 && payload.data?.custom_id) {
      const customId = payload.data.custom_id;
      for (const [idOrReg, route] of this.buttons.entries()) {
        if (typeof idOrReg === 'string' && idOrReg === customId) {
          match = route;
          break;
        } else if (idOrReg instanceof RegExp && idOrReg.test(customId)) {
          match = route;
          break;
        }
      }
    }
    // Type 5 = MODAL_SUBMIT
    else if (payload.type === 5 && payload.data?.custom_id) {
      const customId = payload.data.custom_id;
      for (const [idOrReg, route] of this.modals.entries()) {
        if (typeof idOrReg === 'string' && idOrReg === customId) {
          match = route;
          break;
        } else if (idOrReg instanceof RegExp && idOrReg.test(customId)) {
          match = route;
          break;
        }
      }
    }

    if (!match) {
      return { type: 4, data: { content: 'Command not recognized.' } };
    }

    const scopeContext = this.container.createScope();
    const context: ExecutionContext = {
      getType: () => 'http',
      getPayload: <T = any>(): T => payload as unknown as T,
      getAdapter: <T = any>(): T => null as unknown as T,
      getArg: <T = any>(_index: number): T => payload as unknown as T,
    };

    // Execute Guards
    for (const GuardClass of match.guards) {
      const guardInstance: Guard = this.container.get(GuardClass, scopeContext);
      const allowed = await guardInstance.canActivate(context);
      if (!allowed) {
        return { type: 4, data: { content: 'Forbidden: Access denied by Guard.' } };
      }
    }

    // RateLimit Evaluation
    const rateLimitMeta: any = match.interceptors.find((i: any) => i && typeof i === 'object' && 'isRateLimit' in i);
    if (rateLimitMeta) {
      const userId = payload.user?.id || payload.member?.user?.id || 'global';
      const key = `${userId}:${match.methodName}`;
      const now = Date.now();
      const windowMs =
        typeof rateLimitMeta.options.window === 'number'
          ? rateLimitMeta.options.window
          : String(rateLimitMeta.options.window).endsWith('s')
            ? parseInt(String(rateLimitMeta.options.window)) * 1000
            : parseInt(String(rateLimitMeta.options.window)) * 60000;

      const record = this.rateLimits.get(key);
      if (record && record.expiresAt > now) {
        if (record.count >= rateLimitMeta.options.limit) {
          return {
            type: 4,
            data: { content: rateLimitMeta.options.message || 'Rate limit exceeded. Please wait before trying again.' },
          };
        }
        record.count++;
      } else {
        this.rateLimits.set(key, { count: 1, expiresAt: now + windowMs });
      }
    }

    // Check Permission Decorator Metadata
    const isGuildOnly = Reflect.getMetadata('shardix:guild_only', match.controllerInstance, match.methodName);
    if (isGuildOnly && !payload.guild_id) {
      return { type: 4, data: { content: 'This command can only be used in a server (Guild).' } };
    }

    const isDmOnly = Reflect.getMetadata('shardix:dm_only', match.controllerInstance, match.methodName);
    if (isDmOnly && payload.guild_id) {
      return { type: 4, data: { content: 'This command can only be used in Direct Messages (DMs).' } };
    }

    // Execute Handler with Interceptors pipeline (passes CommandContext as 1st arg, payload as 2nd)
    const ctx = new CommandContext(payload);
    const handler = () => match!.controllerInstance[match!.methodName](ctx, payload);
    
    let pipeline = handler;
    for (const InterceptorClass of match.interceptors.reverse()) {
      if (typeof InterceptorClass === 'function') {
        const interceptorInstance: Interceptor = this.container.get(InterceptorClass, scopeContext);
        const nextFn = pipeline;
        pipeline = () => interceptorInstance.intercept(context, nextFn);
      }
    }

    return await pipeline();
  }

  public async handleEvent(eventName: string, ...args: any[]): Promise<void> {
    const matches = this.eventHandlers.get(eventName) || [];
    for (const match of matches) {
      try {
        await match.controllerInstance[match.methodName](...args);
      } catch (err: any) {
        console.error(`[Shardix] Error executing event handler for '${eventName}':`, err?.message || err);
      }
    }
  }
}
