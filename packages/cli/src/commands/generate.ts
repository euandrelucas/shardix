import * as fs from 'node:fs';
import * as path from 'node:path';
import pc from 'picocolors';

export type GenerateType =
  | 'module'
  | 'controller'
  | 'command'
  | 'event'
  | 'guard'
  | 'interceptor'
  | 'provider'
  | 'service';

export function generateComponent(type: GenerateType, name: string, cwd: string = process.cwd()): void {
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
  const camelName = name.charAt(0).toLowerCase() + name.slice(1);
  const fileName = `${camelName}.${type}.ts`;
  const specFileName = `${camelName}.${type}.spec.ts`;
  const targetDir = path.join(cwd, 'src', camelName);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let codeContent = '';
  let testContent = '';

  switch (type) {
    case 'module':
      codeContent = `import { Module } from '@shardix/common';\n\n@Module({\n  controllers: [],\n  providers: [],\n})\nexport class ${pascalName}Module {}\n`;
      testContent = `import { describe, it, expect } from 'vitest';\nimport { ${pascalName}Module } from './${camelName}.module';\n\ndescribe('${pascalName}Module', () => {\n  it('should be defined', () => {\n    expect(${pascalName}Module).toBeDefined();\n  });\n});\n`;
      break;

    case 'controller':
    case 'command':
      codeContent = `import { Controller, SlashCommand } from '@shardix/common';\n\n@Controller()\nexport class ${pascalName}Controller {\n  @SlashCommand({\n    name: '${camelName}',\n    description: '${pascalName} command',\n  })\n  async handle() {\n    return { type: 4, data: { content: 'Hello from ${pascalName}Controller!' } };\n  }\n}\n`;
      testContent = `import { describe, it, expect } from 'vitest';\nimport { ${pascalName}Controller } from './${camelName}.controller';\n\ndescribe('${pascalName}Controller', () => {\n  it('should return response', async () => {\n    const controller = new ${pascalName}Controller();\n    const res = await controller.handle();\n    expect(res.data.content).toContain('${pascalName}');\n  });\n});\n`;
      break;

    case 'service':
    case 'provider':
      codeContent = `import { Injectable } from '@shardix/common';\n\n@Injectable()\nexport class ${pascalName}Service {\n  getHello(): string {\n    return 'Hello ${pascalName}!';\n  }\n}\n`;
      testContent = `import { describe, it, expect } from 'vitest';\nimport { ${pascalName}Service } from './${camelName}.${type}';\n\ndescribe('${pascalName}Service', () => {\n  it('should return hello', () => {\n    const service = new ${pascalName}Service();\n    expect(service.getHello()).toBe('Hello ${pascalName}!');\n  });\n});\n`;
      break;

    case 'event':
      codeContent = `import { Controller, Event } from '@shardix/common';\n\n@Controller()\nexport class ${pascalName}EventController {\n  @Event('ready')\n  onReady(data: any) {\n    console.log('${pascalName} received event:', data);\n  }\n}\n`;
      testContent = `import { describe, it, expect } from 'vitest';\nimport { ${pascalName}EventController } from './${camelName}.event';\n\ndescribe('${pascalName}EventController', () => {\n  it('should be defined', () => {\n    const ctrl = new ${pascalName}EventController();\n    expect(ctrl).toBeDefined();\n  });\n});\n`;
      break;

    case 'guard':
      codeContent = `import { ExecutionContext, Guard, Injectable } from '@shardix/common';\n\n@Injectable()\nexport class ${pascalName}Guard implements Guard {\n  canActivate(context: ExecutionContext): boolean {\n    return true;\n  }\n}\n`;
      testContent = `import { describe, it, expect } from 'vitest';\nimport { ${pascalName}Guard } from './${camelName}.guard';\n\ndescribe('${pascalName}Guard', () => {\n  it('should allow access', () => {\n    const guard = new ${pascalName}Guard();\n    expect(guard.canActivate({} as any)).toBe(true);\n  });\n});\n`;
      break;

    case 'interceptor':
      codeContent = `import { ExecutionContext, Interceptor, Injectable } from '@shardix/common';\n\n@Injectable()\nexport class ${pascalName}Interceptor implements Interceptor {\n  async intercept(context: ExecutionContext, next: () => Promise<any>): Promise<any> {\n    return await next();\n  }\n}\n`;
      testContent = `import { describe, it, expect } from 'vitest';\nimport { ${pascalName}Interceptor } from './${camelName}.interceptor';\n\ndescribe('${pascalName}Interceptor', () => {\n  it('should intercept and call next', async () => {\n    const interceptor = new ${pascalName}Interceptor();\n    const res = await interceptor.intercept({} as any, async () => 'ok');\n    expect(res).toBe('ok');\n  });\n});\n`;
      break;
  }

  const filePath = path.join(targetDir, fileName);
  const specPath = path.join(targetDir, specFileName);

  fs.writeFileSync(filePath, codeContent, 'utf-8');
  fs.writeFileSync(specPath, testContent, 'utf-8');

  console.log(`${pc.green('CREATE')} ${path.relative(cwd, filePath)}`);
  console.log(`${pc.green('CREATE')} ${path.relative(cwd, specPath)}`);
}
