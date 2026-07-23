import 'reflect-metadata';

export function Permissions(...permissions: string[]): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:permissions', permissions, propertyKey ? target : target, propertyKey as any);
  };
}

export function BotPermissions(...permissions: string[]): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:bot_permissions', permissions, propertyKey ? target : target, propertyKey as any);
  };
}

export function GuildOnly(): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:guild_only', true, propertyKey ? target : target, propertyKey as any);
  };
}

export function DMOnly(): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:dm_only', true, propertyKey ? target : target, propertyKey as any);
  };
}

export function NSFW(): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:nsfw', true, propertyKey ? target : target, propertyKey as any);
  };
}

export function OwnerOnly(): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:owner_only', true, propertyKey ? target : target, propertyKey as any);
  };
}

export function DeveloperOnly(): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:dev_only', true, propertyKey ? target : target, propertyKey as any);
  };
}

export function Cooldown(options: { limit: number; window: string | number }): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:cooldown', options, propertyKey ? target : target, propertyKey as any);
  };
}

export function Concurrency(options: { limit: number }): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:concurrency', options, propertyKey ? target : target, propertyKey as any);
  };
}

export function RequirePremium(): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:require_premium', true, propertyKey ? target : target, propertyKey as any);
  };
}

export function Catch(...exceptions: any[]): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata('shardix:catch_exceptions', exceptions, target);
  };
}

export function UseFilters(...filters: any[]): MethodDecorator & ClassDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    Reflect.defineMetadata('shardix:exception_filters', filters, propertyKey ? target : target, propertyKey as any);
  };
}
