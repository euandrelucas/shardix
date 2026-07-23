import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import * as path from 'node:path';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@shardix/common': path.resolve(__dirname, '../../packages/common/src/index.ts'),
      '@shardix/transport': path.resolve(__dirname, '../../packages/transport/src/index.ts'),
      '@shardix/http': path.resolve(__dirname, '../../packages/http/src/index.ts'),
      '@shardix/config': path.resolve(__dirname, '../../packages/config/src/index.ts'),
      '@shardix/cluster': path.resolve(__dirname, '../../packages/cluster/src/index.ts'),
      '@shardix/ipc': path.resolve(__dirname, '../../packages/ipc/src/index.ts'),
      '@shardix/runtime-distributed': path.resolve(__dirname, '../../packages/runtime-distributed/src/index.ts'),
      '@shardix/provider-queue': path.resolve(__dirname, '../../packages/provider-queue/src/index.ts'),
      '@shardix/provider-observability': path.resolve(__dirname, '../../packages/provider-observability/src/index.ts'),
      '@shardix/dashboard-api': path.resolve(__dirname, '../../packages/dashboard-api/src/index.ts'),
      '@shardix/discordjs': path.resolve(__dirname, '../../packages/discordjs/src/index.ts'),
      '@shardix/eris': path.resolve(__dirname, '../../packages/eris/src/index.ts'),
      '@shardix/oceanicjs': path.resolve(__dirname, '../../packages/oceanicjs/src/index.ts'),
      '@shardix/discordeno': path.resolve(__dirname, '../../packages/discordeno/src/index.ts'),
      '@shardix/provider-dashboard': path.resolve(__dirname, '../../packages/provider-dashboard/src/index.ts'),
      '@shardix/dashboard': path.resolve(__dirname, '../../packages/dashboard/src/index.ts'),
      '@shardix/plugin': path.resolve(__dirname, '../../packages/plugin/src/index.ts'),
      '@shardix/testing': path.resolve(__dirname, '../../packages/testing/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
