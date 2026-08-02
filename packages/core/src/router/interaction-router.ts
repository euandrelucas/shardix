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
  private autocompletes = new Map<string, RouteMatch>(); // key: commandName or commandName:optionName
  private selectMenus = new Map<string | RegExp, RouteMatch>();
  private contextMenus = new Map<string, RouteMatch>();
  private eventHandlers = new Map<string, RouteMatch[]>();
  private rateLimits = new Map<string, { count: number; expiresAt: number }>();
  private rateLimitCleanupTimer?: NodeJS.Timeout;
  private adapterRef?: any;

  constructor(private container: Container) {
    // Periodically clean up expired rate limit entries to prevent memory leaks
    this.rateLimitCleanupTimer = setInterval(() => this.cleanupExpiredRateLimits(), 60_000);
    // Allow process to exit even if cleanup timer is running
    if (this.rateLimitCleanupTimer.unref) {
      this.rateLimitCleanupTimer.unref();
    }
  }

  public setAdapter(adapter: any): void {
    this.adapterRef = adapter;
  }

  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    for (const [key, record] of this.rateLimits.entries()) {
      if (record.expiresAt <= now) {
        this.rateLimits.delete(key);
      }
    }
  }

  public dispose(): void {
    if (this.rateLimitCleanupTimer) {
      clearInterval(this.rateLimitCleanupTimer);
    }
  }

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

    // Context Menus
    const contextMenus: any[] = Reflect.getMetadata(METADATA_KEYS.CONTEXT_MENU, controllerClass) || [];
    for (const item of contextMenus) {
      this.contextMenus.set(item.options.name, {
        controllerInstance,
        methodName: item.methodName,
        guards: controllerGuards,
        pipes: controllerPipes,
        interceptors: controllerInterceptors,
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

    // Select Menus
    const selectMenus: any[] = Reflect.getMetadata(METADATA_KEYS.SELECT_MENU, controllerClass) || [];
    for (const item of selectMenus) {
      this.selectMenus.set(item.customId, {
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

    // Autocomplete
    const autocompletes: any[] = Reflect.getMetadata(METADATA_KEYS.AUTOCOMPLETE, controllerClass) || [];
    for (const item of autocompletes) {
      const key = item.optionName ? `${item.commandName}:${item.optionName}` : item.commandName;
      this.autocompletes.set(key, {
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

  private findComponentMatch(map: Map<string | RegExp, RouteMatch>, customId: string): RouteMatch | undefined {
    for (const [idOrReg, route] of map.entries()) {
      if (typeof idOrReg === 'string' && idOrReg === customId) return route;
      if (idOrReg instanceof RegExp && idOrReg.test(customId)) return route;
    }
    return undefined;
  }

  public async handleInteraction(payload: InteractionPayload): Promise<any> {
    let match: RouteMatch | undefined;

    // Type 1 = PING (return pong)
    if (payload.type === 1) {
      return { type: 1 };
    }

    // Type 2 = APPLICATION_COMMAND (Slash Commands & Context Menus)
    if (payload.type === 2) {
      if (payload.data?.name) {
        match = this.slashCommands.get(payload.data.name);
        if (!match) match = this.contextMenus.get(payload.data.name);
      }
    }
    // Type 3 = MESSAGE_COMPONENT (Buttons & Select Menus)
    else if (payload.type === 3 && payload.data?.custom_id) {
      const customId = payload.data.custom_id;
      // component_type 2 = Button, 3+ = Select Menus
      if (payload.data.component_type === 2 || !payload.data.component_type) {
        match = this.findComponentMatch(this.buttons, customId);
      }
      if (!match) {
        match = this.findComponentMatch(this.selectMenus, customId);
      }
    }
    // Type 4 = AUTOCOMPLETE
    else if (payload.type === 4 && payload.data?.name) {
      const focusedOption = payload.data.options?.find((o: any) => o.focused);
      const key = focusedOption ? `${payload.data.name}:${focusedOption.name}` : payload.data.name;
      match = this.autocompletes.get(key) || this.autocompletes.get(payload.data.name);
      if (match) {
        const ctx = new CommandContext(payload, this.adapterRef);
        const result = await match.controllerInstance[match.methodName](ctx, payload);
        return result; // Autocomplete results don't go through the full pipeline
      }
    }
    // Type 5 = MODAL_SUBMIT
    else if (payload.type === 5 && payload.data?.custom_id) {
      match = this.findComponentMatch(this.modals, payload.data.custom_id);
    }

    if (!match) {
      // Silently ignore unhandled interactions instead of returning an error
      return undefined;
    }

    const scopeContext = this.container.createScope();
    const context: ExecutionContext = {
      getType: () => 'gateway',
      getPayload: <T = any>(): T => payload as unknown as T,
      getAdapter: <T = any>(): T => this.adapterRef as unknown as T,
      getArg: <T = any>(_index: number): T => payload as unknown as T,
    };

    // Execute Guards
    for (const GuardClass of match.guards) {
      const guardInstance: Guard = this.container.get(GuardClass, scopeContext);
      const allowed = await guardInstance.canActivate(context);
      if (!allowed) {
        return { type: 4, data: { content: 'Forbidden: Access denied.', flags: 64 } };
      }
    }

    // Permission checks
    const isGuildOnly = Reflect.getMetadata('shardix:guild_only', match.controllerInstance.constructor, match.methodName);
    if (isGuildOnly && !payload.guild_id) {
      return { type: 4, data: { content: 'This command can only be used in a server.', flags: 64 } };
    }

    const isDmOnly = Reflect.getMetadata('shardix:dm_only', match.controllerInstance.constructor, match.methodName);
    if (isDmOnly && payload.guild_id) {
      return { type: 4, data: { content: 'This command can only be used in DMs.', flags: 64 } };
    }

    // Rate limit check
    const rateLimitMeta: any = Reflect.getMetadata('shardix:rate_limit', match.controllerInstance.constructor, match.methodName);
    if (rateLimitMeta) {
      const userId = payload.user?.id || payload.member?.user?.id || 'global';
      const key = `${userId}:${match.methodName}`;
      const now = Date.now();
      const rawWindow = rateLimitMeta.window;
      let windowMs: number;
      if (typeof rawWindow === 'number') {
        windowMs = rawWindow;
      } else {
        const windowStr = String(rawWindow);
        if (windowStr.endsWith('m')) {
          windowMs = parseInt(windowStr) * 60_000;
        } else if (windowStr.endsWith('s')) {
          windowMs = parseInt(windowStr) * 1_000;
        } else {
          // Treat plain string numbers as milliseconds
          windowMs = parseInt(windowStr);
        }
      }

      const record = this.rateLimits.get(key);
      if (record && record.expiresAt > now) {
        if (record.count >= rateLimitMeta.limit) {
          return { type: 4, data: { content: rateLimitMeta.message || 'Rate limit exceeded. Please wait.', flags: 64 } };
        }
        record.count++;
      } else {
        this.rateLimits.set(key, { count: 1, expiresAt: now + windowMs });
      }
    }

    // Build CommandContext with adapter reference for native reply support
    const ctx = new CommandContext(payload, this.adapterRef);

    // Execute with Interceptors pipeline
    const handler = () => match!.controllerInstance[match!.methodName](ctx, payload);

    let pipeline = handler;
    const reversedInterceptors = [...match.interceptors].reverse();
    for (const InterceptorClass of reversedInterceptors) {
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
        console.error(`[Shardix] Error handling event '${eventName}':`, err?.message || err);
      }
    }
  }

  /** Get all registered slash command data for registration with Discord */
  public getSlashCommandData(): any[] {
    const commands: any[] = [];
    for (const [name, match] of this.slashCommands.entries()) {
      // Find the original decorator metadata
      const slashCmds: any[] = Reflect.getMetadata(
        METADATA_KEYS.SLASH_COMMAND,
        match.controllerInstance.constructor
      ) || [];
      const cmd = slashCmds.find(c => c.options.name === name);
      if (cmd) {
        commands.push(cmd.options);
      }
    }
    return commands;
  }
}
