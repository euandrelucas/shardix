import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Injectable, Scope, Inject } from '@shardix/common';
import { Container } from '../src/di/container.js';

@Injectable()
class ServiceA {
  getValue() {
    return 'A';
  }
}

@Injectable()
class ServiceB {
  constructor(public serviceA: ServiceA) {}
}

@Injectable({ scope: Scope.TRANSIENT })
class TransientService {
  public id = Math.random();
}

@Injectable({ scope: Scope.SCOPED })
class ScopedService {
  public id = Math.random();
}

describe('Container (IoC)', () => {
  it('should resolve singleton dependencies correctly', () => {
    const container = new Container();
    container.register(ServiceA);
    container.register(ServiceB);

    const instanceB = container.get(ServiceB);
    expect(instanceB).toBeInstanceOf(ServiceB);
    expect(instanceB.serviceA.getValue()).toBe('A');

    const instanceB2 = container.get(ServiceB);
    expect(instanceB2).toBe(instanceB);
  });

  it('should resolve transient dependencies as new instances', () => {
    const container = new Container();
    container.register(TransientService);

    const inst1 = container.get(TransientService);
    const inst2 = container.get(TransientService);

    expect(inst1).not.toBe(inst2);
    expect(inst1.id).not.toBe(inst2.id);
  });

  it('should resolve scoped dependencies per scope context', () => {
    const container = new Container();
    container.register(ScopedService);

    const scope1 = container.createScope();
    const scope2 = container.createScope();

    const inst1a = container.get(ScopedService, scope1);
    const inst1b = container.get(ScopedService, scope1);
    const inst2 = container.get(ScopedService, scope2);

    expect(inst1a).toBe(inst1b);
    expect(inst1a).not.toBe(inst2);
  });

  it('should handle custom value and factory providers', () => {
    const container = new Container();
    const TOKEN_CONFIG = Symbol('CONFIG');

    container.register({
      provide: TOKEN_CONFIG,
      useValue: { env: 'test' },
    });

    container.register({
      provide: 'FACTORY_VAL',
      useFactory: (cfg: any) => `env:${cfg.env}`,
      inject: [TOKEN_CONFIG],
    });

    expect(container.get(TOKEN_CONFIG)).toEqual({ env: 'test' });
    expect(container.get('FACTORY_VAL')).toBe('env:test');
  });

  it('should detect circular dependencies', () => {
    const container = new Container();

    @Injectable()
    class CircularA {
      constructor(@Inject('CIRCULAR_B') public b: any) {}
    }

    @Injectable()
    class CircularB {
      constructor(@Inject(CircularA) public a: any) {}
    }

    container.register({ provide: CircularA, useClass: CircularA });
    container.register({ provide: 'CIRCULAR_B', useClass: CircularB });

    expect(() => container.get(CircularA)).toThrow(/Circular dependency/);
  });
});
