import 'reflect-metadata';
import { METADATA_KEYS, Type } from '@shardix/common';

export interface ProcessedReflectionMetadata {
  isController: boolean;
  isInjectable: boolean;
  isModule: boolean;
  slashCommands: any[];
  buttons: any[];
  modals: any[];
  events: any[];
  autocompletes: any[];
  guards: any[];
  pipes: any[];
  interceptors: any[];
}

export class ReflectionContainer {
  private static cache = new WeakMap<object, ProcessedReflectionMetadata>();
  private static reflectionCountMap = new Map<object, number>();

  public static reflect(targetClass: Type<any>): ProcessedReflectionMetadata {
    if (this.cache.has(targetClass)) {
      return this.cache.get(targetClass)!;
    }

    const count = (this.reflectionCountMap.get(targetClass) || 0) + 1;
    this.reflectionCountMap.set(targetClass, count);

    const isController = Reflect.hasMetadata(METADATA_KEYS.CONTROLLER, targetClass);
    const isInjectable = Reflect.hasMetadata(METADATA_KEYS.INJECTABLE, targetClass);
    const isModule = Reflect.hasMetadata(METADATA_KEYS.MODULE, targetClass);

    const slashCommands = Reflect.getMetadata(METADATA_KEYS.SLASH_COMMAND, targetClass) || [];
    const buttons = Reflect.getMetadata(METADATA_KEYS.BUTTON, targetClass) || [];
    const modals = Reflect.getMetadata(METADATA_KEYS.MODAL, targetClass) || [];
    const events = Reflect.getMetadata(METADATA_KEYS.EVENT, targetClass) || [];
    const autocompletes = Reflect.getMetadata(METADATA_KEYS.AUTOCOMPLETE, targetClass) || [];
    const guards = Reflect.getMetadata(METADATA_KEYS.GUARDS, targetClass) || [];
    const pipes = Reflect.getMetadata(METADATA_KEYS.PIPES, targetClass) || [];
    const interceptors = Reflect.getMetadata(METADATA_KEYS.INTERCEPTORS, targetClass) || [];

    const processed: ProcessedReflectionMetadata = {
      isController,
      isInjectable,
      isModule,
      slashCommands,
      buttons,
      modals,
      events,
      autocompletes,
      guards,
      pipes,
      interceptors,
    };

    this.cache.set(targetClass, processed);
    return processed;
  }

  public static getReflectionCount(targetClass: Type<any>): number {
    return this.reflectionCountMap.get(targetClass) || 0;
  }

  public static clearCache(): void {
    this.cache = new WeakMap();
    this.reflectionCountMap.clear();
  }
}
