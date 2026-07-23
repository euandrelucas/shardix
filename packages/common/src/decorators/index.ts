import 'reflect-metadata';
import { METADATA_KEYS } from '../constants.js';
import {
  InjectableOptions,
  InjectionToken,
  ModuleMetadata,
  Scope,
  Type,
  Guard,
  Pipe,
  Interceptor,
  Middleware,
} from '../interfaces/index.js';

export function Injectable(options?: InjectableOptions): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, options || { scope: Scope.SINGLETON }, target);
  };
}

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(METADATA_KEYS.MODULE, metadata, target);
  };
}

export function Inject(token: InjectionToken): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existing: Map<number, InjectionToken> =
      Reflect.getOwnMetadata(METADATA_KEYS.PARAM_INJECT, target, propertyKey ?? '') || new Map();
    existing.set(parameterIndex, token);
    Reflect.defineMetadata(METADATA_KEYS.PARAM_INJECT, existing, target, propertyKey ?? '');
  };
}

export function Controller(prefix?: string): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, { prefix: prefix || '' }, target);
  };
}

export interface SlashCommandOptions {
  name: string;
  description: string;
  options?: any[];
  guilds?: string[];
}

export function SlashCommand(options: SlashCommandOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.SLASH_COMMAND, target.constructor) || [];
    existing.push({ methodName: propertyKey, options });
    Reflect.defineMetadata(METADATA_KEYS.SLASH_COMMAND, existing, target.constructor);
  };
}

export interface ContextMenuOptions {
  name: string;
  type: 'USER' | 'MESSAGE';
}

export function ContextMenu(options: ContextMenuOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.CONTEXT_MENU, target.constructor) || [];
    existing.push({ methodName: propertyKey, options });
    Reflect.defineMetadata(METADATA_KEYS.CONTEXT_MENU, existing, target.constructor);
  };
}

export function MessageCommand(name: string): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.MESSAGE_COMMAND, target.constructor) || [];
    existing.push({ methodName: propertyKey, name });
    Reflect.defineMetadata(METADATA_KEYS.MESSAGE_COMMAND, existing, target.constructor);
  };
}

export function Button(customId: string | RegExp): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.BUTTON, target.constructor) || [];
    existing.push({ methodName: propertyKey, customId });
    Reflect.defineMetadata(METADATA_KEYS.BUTTON, existing, target.constructor);
  };
}

export function Modal(customId: string | RegExp): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.MODAL, target.constructor) || [];
    existing.push({ methodName: propertyKey, customId });
    Reflect.defineMetadata(METADATA_KEYS.MODAL, existing, target.constructor);
  };
}

export function Autocomplete(commandName: string, optionName?: string): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.AUTOCOMPLETE, target.constructor) || [];
    existing.push({ methodName: propertyKey, commandName, optionName });
    Reflect.defineMetadata(METADATA_KEYS.AUTOCOMPLETE, existing, target.constructor);
  };
}

export function SelectMenu(customId: string | RegExp): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.SELECT_MENU, target.constructor) || [];
    existing.push({ methodName: propertyKey, customId });
    Reflect.defineMetadata(METADATA_KEYS.SELECT_MENU, existing, target.constructor);
  };
}

export function Event(eventName: string): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.EVENT, target.constructor) || [];
    existing.push({ methodName: propertyKey, eventName });
    Reflect.defineMetadata(METADATA_KEYS.EVENT, existing, target.constructor);
  };
}

export function Cron(expression: string): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.CRON, target.constructor) || [];
    existing.push({ methodName: propertyKey, expression });
    Reflect.defineMetadata(METADATA_KEYS.CRON, existing, target.constructor);
  };
}

export function Interval(ms: number): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.INTERVAL, target.constructor) || [];
    existing.push({ methodName: propertyKey, ms });
    Reflect.defineMetadata(METADATA_KEYS.INTERVAL, existing, target.constructor);
  };
}

export function UseGuards(...guards: Type<Guard>[]): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      const existing = Reflect.getMetadata(METADATA_KEYS.GUARDS, target.constructor, propertyKey) || [];
      Reflect.defineMetadata(METADATA_KEYS.GUARDS, [...existing, ...guards], target.constructor, propertyKey);
    } else {
      const existing = Reflect.getMetadata(METADATA_KEYS.GUARDS, target) || [];
      Reflect.defineMetadata(METADATA_KEYS.GUARDS, [...existing, ...guards], target);
    }
  };
}

export function UsePipes(...pipes: Type<Pipe>[]): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      const existing = Reflect.getMetadata(METADATA_KEYS.PIPES, target.constructor, propertyKey) || [];
      Reflect.defineMetadata(METADATA_KEYS.PIPES, [...existing, ...pipes], target.constructor, propertyKey);
    } else {
      const existing = Reflect.getMetadata(METADATA_KEYS.PIPES, target) || [];
      Reflect.defineMetadata(METADATA_KEYS.PIPES, [...existing, ...pipes], target);
    }
  };
}

export function UseInterceptors(...interceptors: Type<Interceptor>[]): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      const existing = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, target.constructor, propertyKey) || [];
      Reflect.defineMetadata(METADATA_KEYS.INTERCEPTORS, [...existing, ...interceptors], target.constructor, propertyKey);
    } else {
      const existing = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, target) || [];
      Reflect.defineMetadata(METADATA_KEYS.INTERCEPTORS, [...existing, ...interceptors], target);
    }
  };
}

export function DependsOn(...dependencies: Type<any>[]): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(METADATA_KEYS.DEPENDS_ON, dependencies, target);
  };
}
