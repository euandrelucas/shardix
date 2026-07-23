export interface ShardixPlugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  register(app: any): Promise<void> | void;
  onInit?(app: any): Promise<void> | void;
  onShutdown?(app: any): Promise<void> | void;
}

export interface ShardixManifest {
  name?: string;
  version?: string;
  plugins?: string[];
  config?: Record<string, any>;
}

export class PluginManager {
  private plugins = new Map<string, ShardixPlugin>();

  public register(plugin: ShardixPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`[PluginManager] Plugin '${plugin.name}' is already registered.`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  public async initAll(app: any): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        await plugin.register(app);
        if (plugin.onInit) {
          await plugin.onInit(app);
        }
      } catch (err: any) {
        throw new Error(`[PluginManager] Failed to initialize plugin '${name}': ${err?.message || err}`);
      }
    }
  }

  public async shutdownAll(app: any): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.onShutdown) {
        try {
          await plugin.onShutdown(app);
        } catch (err: any) {
          console.error(`[PluginManager] Error shutting down plugin '${name}':`, err);
        }
      }
    }
  }

  public getPlugins(): ShardixPlugin[] {
    return Array.from(this.plugins.values());
  }

  public hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }
}
