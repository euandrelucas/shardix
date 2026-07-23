import 'reflect-metadata';
import {
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

    // Execute Handler with Interceptors pipeline
    const handler = () => match!.controllerInstance[match!.methodName](payload);
    
    let pipeline = handler;
    for (const InterceptorClass of match.interceptors.reverse()) {
      const interceptorInstance: Interceptor = this.container.get(InterceptorClass, scopeContext);
      const nextFn = pipeline;
      pipeline = () => interceptorInstance.intercept(context, nextFn);
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
