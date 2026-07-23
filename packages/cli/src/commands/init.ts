import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

export interface InitProjectOptions {
  name: string;
  targetDir?: string;
  adapter?: 'discordjs' | 'eris' | 'oceanicjs' | 'discordeno';
  transport?: 'gateway' | 'http' | 'hybrid';
  database?: 'none' | 'prisma' | 'drizzle';
  redis?: boolean;
  docker?: boolean;
}

export function createProjectFiles(options: InitProjectOptions): string {
  const projectName = options.name || 'my-shardix-bot';
  const adapter = options.adapter || 'discordjs';
  const projectDir = path.resolve(process.cwd(), options.targetDir || projectName);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const srcDir = path.join(projectDir, 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // 1. package.json
  const adapterPkgMap: Record<string, { pkg: string; client: string; clientVer: string }> = {
    discordjs: { pkg: '@shardix/discordjs', client: 'discord.js', clientVer: '^14.17.3' },
    eris: { pkg: '@shardix/eris', client: 'eris', clientVer: '^0.17.2' },
    oceanicjs: { pkg: '@shardix/oceanicjs', client: 'oceanic.js', clientVer: '^1.10.0' },
    discordeno: { pkg: '@shardix/discordeno', client: '@discordeno/bot', clientVer: '^19.0.0' },
  };

  const selectedAdapter = adapterPkgMap[adapter] || adapterPkgMap.discordjs;

  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'Enterprise Discord Application powered by Shardix Framework',
    main: 'dist/main.js',
    scripts: {
      build: 'tsup',
      start: 'node dist/main.js',
      dev: 'tsx watch src/main.ts',
    },
    dependencies: {
      '@shardix/core': '^0.6.1',
      '@shardix/common': '^0.6.1',
      [selectedAdapter.pkg]: '^0.6.1',
      [selectedAdapter.client]: selectedAdapter.clientVer,
      dotenv: '^16.4.7',
    },
    devDependencies: {
      '@types/node': '^22.10.1',
      tsx: '^4.19.2',
      tsup: '^8.3.5',
      typescript: '^5.7.2',
    },
  };

  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // 2. tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: './dist',
    },
    include: ['src/**/*'],
  };

  fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

  // 3. shardix.config.ts
  const shardixConfig = `export default {
  appName: '${projectName}',
  adapter: '${adapter}',
  runtime: '${options.transport || 'gateway'}',
  providers: ['config', 'logger', 'dashboard'],
};
`;
  fs.writeFileSync(path.join(projectDir, 'shardix.config.ts'), shardixConfig);

  // 4. .env
  const envContent = `DISCORD_TOKEN=your_discord_bot_token_here
PORT=3005
SHARDIX_DASHBOARD_TOKEN=secret_admin_token
`;
  fs.writeFileSync(path.join(projectDir, '.env'), envContent);

  // 5. .gitignore
  const gitignoreContent = `node_modules
dist
.env
*.log
`;
  fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignoreContent);

  // 6. src/user.service.ts
  const userServiceContent = `import { Injectable } from '@shardix/common';

@Injectable()
export class UserService {
  async getWelcomeMessage(username: string): Promise<string> {
    return \`Welcome to Shardix Framework, \${username}! ⚡\`;
  }
}
`;
  fs.writeFileSync(path.join(srcDir, 'user.service.ts'), userServiceContent);

  // 7. src/ping.controller.ts
  const pingControllerContent = `import { Controller, SlashCommand, On, Once } from '@shardix/common';
import { UserService } from './user.service.js';

@Controller()
export class PingController {
  constructor(private userService: UserService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Replies with Pong and Shardix status!',
  })
  async ping(interaction: any) {
    const msg = await this.userService.getWelcomeMessage(interaction.user?.username || 'Developer');
    return {
      type: 4,
      data: {
        content: \`🏓 Pong! \${msg}\`,
      },
    };
  }

  @On('guildMemberAdd')
  onMemberJoin(member: any) {
    console.log(\`[EVENT] Member joined: \${member?.user?.username || member}\`);
  }

  @Once('ready')
  onReady() {
    console.log('⚡ Shardix Gateway Connection Ready!');
  }
}
`;
  fs.writeFileSync(path.join(srcDir, 'ping.controller.ts'), pingControllerContent);

  // 8. src/main.ts
  const adapterClassMap: Record<string, { importPath: string; className: string }> = {
    discordjs: { importPath: '@shardix/discordjs', className: 'DiscordJSAdapter' },
    eris: { importPath: '@shardix/eris', className: 'ErisAdapter' },
    oceanicjs: { importPath: '@shardix/oceanicjs', className: 'OceanicAdapter' },
    discordeno: { importPath: '@shardix/discordeno', className: 'DiscordenoAdapter' },
  };

  const selectedClass = adapterClassMap[adapter] || adapterClassMap.discordjs;

  const mainTsContent = `import { ShardixFactory, AutoScanner } from '@shardix/core';
import { ${selectedClass.className} } from '${selectedClass.importPath}';
import { PingController } from './ping.controller.js';
import { UserService } from './user.service.js';

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new ${selectedClass.className}(),
  });

  AutoScanner.scanAndRegister(app, [UserService, PingController]);

  await app.start();
  console.log('🚀 Shardix Application is online and ready!');
}

bootstrap();
`;
  fs.writeFileSync(path.join(srcDir, 'main.ts'), mainTsContent);

  // 9. README.md
  const readmeContent = `# ${projectName}

Enterprise Discord Application built with **Shardix Framework**.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Set your \`DISCORD_TOKEN\` in \`.env\`.

3. Run in development mode:
   \`\`\`bash
   pnpm dev
   \`\`\`
`;
  fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent);

  // 10. Dockerfile & docker-compose.yml (if requested or by default)
  if (options.docker !== false) {
    const dockerfileContent = `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3005
CMD ["node", "dist/main.js"]
`;
    fs.writeFileSync(path.join(projectDir, 'Dockerfile'), dockerfileContent);
  }

  return projectDir;
}
