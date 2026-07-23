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
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
