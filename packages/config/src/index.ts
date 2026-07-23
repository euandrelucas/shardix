export interface ShardixUserConfig {
  runtime?: 'gateway' | 'http' | 'hybrid' | any;
  adapter?: 'discordjs' | 'eris' | 'discordeno' | any;
  logger?: boolean | { level?: string; pretty?: boolean };
  redis?: boolean | { url?: string };
  autoAnalyze?: boolean;
  http?: {
    port?: number;
    host?: string;
    publicKey?: string;
  };
}

export function defineConfig(config: ShardixUserConfig): ShardixUserConfig {
  return config;
}
