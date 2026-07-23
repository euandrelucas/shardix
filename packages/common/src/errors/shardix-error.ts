export class ShardixError extends Error {
  public readonly code: string;
  public readonly solution?: string;
  public readonly docsUrl?: string;

  constructor(message: string, options: { code: string; solution?: string; docsUrl?: string }) {
    super(message);
    this.name = 'ShardixError';
    this.code = options.code;
    this.solution = options.solution;
    this.docsUrl = options.docsUrl || `https://github.com/shardix/shardix/tree/main/docs`;
  }
}

export class ConfigurationError extends ShardixError {
  constructor(message: string, solution?: string) {
    super(message, {
      code: 'ERR_SHARDIX_CONFIG',
      solution: solution || 'Check your shardix.config.ts or .env file configuration.',
    });
    this.name = 'ConfigurationError';
  }
}

export class ProviderError extends ShardixError {
  constructor(providerName: string, message: string, solution?: string) {
    super(`[Provider: ${providerName}] ${message}`, {
      code: 'ERR_SHARDIX_PROVIDER',
      solution: solution || `Verify that ${providerName} is registered before use.`,
    });
    this.name = 'ProviderError';
  }
}

export class RuntimeError extends ShardixError {
  constructor(runtimeName: string, message: string, solution?: string) {
    super(`[Runtime: ${runtimeName}] ${message}`, {
      code: 'ERR_SHARDIX_RUNTIME',
      solution: solution || 'Ensure the runtime environment is properly initialized.',
    });
    this.name = 'RuntimeError';
  }
}

export class InteractionError extends ShardixError {
  constructor(message: string, solution?: string) {
    super(message, {
      code: 'ERR_SHARDIX_INTERACTION',
      solution: solution || 'Verify slash command or interaction payload structure.',
    });
    this.name = 'InteractionError';
  }
}

export class AdapterError extends ShardixError {
  constructor(adapterName: string, message: string, solution?: string) {
    super(`[Adapter: ${adapterName}] ${message}`, {
      code: 'ERR_SHARDIX_ADAPTER',
      solution: solution || `Install the required library for ${adapterName}.`,
    });
    this.name = 'AdapterError';
  }
}

export class PluginError extends ShardixError {
  constructor(pluginName: string, message: string, solution?: string) {
    super(`[Plugin: ${pluginName}] ${message}`, {
      code: 'ERR_SHARDIX_PLUGIN',
      solution: solution || `Verify ${pluginName} compatibility and options.`,
    });
    this.name = 'PluginError';
  }
}
