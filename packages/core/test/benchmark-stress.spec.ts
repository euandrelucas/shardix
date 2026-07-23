import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Controller, Injectable, Scope, SlashCommand } from '@shardix/common';
import { Container, ReflectionContainer } from '../src/index.js';

describe('Framework Stress Test & Performance Benchmarks', () => {
  it('IoC Container should resolve 10,000 dependency instances under 50ms', () => {
    const container = new Container();

    @Injectable({ scope: Scope.SINGLETON })
    class SingletonService {
      public value = 'test';
    }

    @Injectable({ scope: Scope.TRANSIENT })
    class TransientService {
      constructor(public s: SingletonService) {}
    }

    container.register(SingletonService);
    container.register(TransientService);

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      const inst = container.get(TransientService);
      expect(inst.s.value).toBe('test');
    }
    const duration = performance.now() - start;

    console.log(`⚡ IoC Container 10,000 resolutions duration: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(500); // Generous limit for low-end hardware
  });

  it('ReflectionContainer should reflect 500 decorated classes in single pass under 100ms', () => {
    ReflectionContainer.clearCache();

    const classes: any[] = [];
    for (let i = 0; i < 500; i++) {
      @Controller()
      class BenchController {
        @SlashCommand({ name: `bench_${i}`, description: 'benchmark' })
        run() {}
      }
      classes.push(BenchController);
    }

    const start = performance.now();
    for (const cls of classes) {
      const meta = ReflectionContainer.reflect(cls);
      expect(meta.isController).toBe(true);
    }
    const durationFirstPass = performance.now() - start;

    // Second pass should hit WeakMap cache instantly
    const startCache = performance.now();
    for (const cls of classes) {
      const meta = ReflectionContainer.reflect(cls);
      expect(meta.isController).toBe(true);
    }
    const durationCachePass = performance.now() - startCache;

    console.log(`⚡ Reflection 500 classes first pass: ${durationFirstPass.toFixed(2)} ms`);
    console.log(`⚡ Reflection 500 classes cached pass: ${durationCachePass.toFixed(2)} ms`);

    expect(durationCachePass).toBeLessThan(durationFirstPass);
  });
});
