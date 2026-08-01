import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import pc from 'picocolors';

export interface InitProjectOptions {
  name: string;
  targetDir?: string;
  adapter?: 'discordjs' | 'eris' | 'oceanicjs' | 'discordeno';
  transport?: 'gateway' | 'http' | 'hybrid';
  database?: 'none' | 'prisma' | 'drizzle';
  redis?: boolean;
  docker?: boolean;
  installDeps?: boolean;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
}

export function createProjectFiles(options: InitProjectOptions): string {
  const projectName = options.name || 'my-shardix-bot';
  const adapter = options.adapter || 'discordjs';
  const packageManager = options.packageManager || detectPackageManager();
  const projectDir = path.resolve(process.cwd(), options.targetDir || projectName);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const srcDir = path.join(projectDir, 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  const adapterPkgMap: Record<string, { pkg: string; client: string; clientVer: string }> = {
    discordjs: { pkg: '@shardix/discordjs', client: 'discord.js', clientVer: '^14.17.3' },
    eris: { pkg: '@shardix/eris', client: 'eris', clientVer: '^0.17.2' },
    oceanicjs: { pkg: '@shardix/oceanicjs', client: 'oceanic.js', clientVer: '^1.10.0' },
    discordeno: { pkg: '@shardix/discordeno', client: '@discordeno/bot', clientVer: '^19.0.0' },
  };

  const adapterClassMap: Record<string, { importPath: string; className: string }> = {
    discordjs: { importPath: '@shardix/discordjs', className: 'DiscordJSAdapter' },
    eris: { importPath: '@shardix/eris', className: 'ErisAdapter' },
    oceanicjs: { importPath: '@shardix/oceanicjs', className: 'OceanicAdapter' },
    discordeno: { importPath: '@shardix/discordeno', className: 'DiscordenoAdapter' },
  };

  const selectedAdapter = adapterPkgMap[adapter] || adapterPkgMap.discordjs;
  const selectedClass = adapterClassMap[adapter] || adapterClassMap.discordjs;

  // ─── 1. package.json ────────────────────────────────────────────────────────
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'Discord Application powered by Shardix Framework',
    main: 'dist/main.js',
    scripts: {
      build: 'tsup src/main.ts --format cjs --dts',
      start: 'node dist/main.js',
      dev: 'tsx watch src/main.ts',
      'register-commands': 'tsx src/register-commands.ts',
      'lint': 'tsc --noEmit',
    },
    dependencies: {
      '@shardix/core': '^0.8.0',
      '@shardix/common': '^0.8.0',
      [selectedAdapter.pkg]: '^0.8.0',
      [selectedAdapter.client]: selectedAdapter.clientVer,
      'dotenv': '^16.4.7',
    },
    devDependencies: {
      '@types/node': '^22.10.1',
      'tsx': '^4.19.2',
      'tsup': '^8.3.5',
      'typescript': '^5.7.2',
    },
  };

  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // ─── 2. tsconfig.json ───────────────────────────────────────────────────────
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'CommonJS',
      moduleResolution: 'Node',
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
      strict: false,
      skipLibCheck: true,
      outDir: './dist',
      declaration: true,
      sourceMap: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

  // ─── 3. .env ────────────────────────────────────────────────────────────────
  const envContent = `# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_id_here
# Optional: Restrict command registration to a specific server (faster for testing)
# GUILD_ID=your_test_server_id_here

# Application Configuration
NODE_ENV=development
PORT=3005
LOG_LEVEL=info
`;
  fs.writeFileSync(path.join(projectDir, '.env'), envContent);
  fs.writeFileSync(path.join(projectDir, '.env.example'), envContent.replace('your_discord_bot_token_here', 'YOUR_TOKEN').replace('your_discord_application_id_here', 'YOUR_CLIENT_ID'));

  // ─── 4. .gitignore ──────────────────────────────────────────────────────────
  fs.writeFileSync(path.join(projectDir, '.gitignore'), `node_modules/
dist/
.env
*.log
.turbo/
`);

  // ─── 5. src/app.module.ts ────────────────────────────────────────────────────
  const appModuleContent = `import { Module } from '@shardix/common';
import { PingController } from './ping.controller.js';
import { UserService } from './user.service.js';

@Module({
  providers: [UserService],
  controllers: [PingController],
})
export class AppModule {}
`;
  fs.writeFileSync(path.join(srcDir, 'app.module.ts'), appModuleContent);

  // ─── 6. src/user.service.ts ─────────────────────────────────────────────────
  const userServiceContent = `import { Injectable } from '@shardix/common';

@Injectable()
export class UserService {
  async getWelcomeMessage(username: string): Promise<string> {
    return \`Welcome, \${username}! Built with Shardix ⚡\`;
  }
}
`;
  fs.writeFileSync(path.join(srcDir, 'user.service.ts'), userServiceContent);

  // ─── 7. src/ping.controller.ts ──────────────────────────────────────────────
  const pingControllerContent = `import { Controller, SlashCommand, Button, On, Once } from '@shardix/common';
import { CommandContext, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from '@shardix/common';
import { UserService } from './user.service.js';

@Controller()
export class PingController {
  constructor(private readonly userService: UserService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Replies with Pong and bot status!',
  })
  async ping(ctx: CommandContext) {
    const welcome = await this.userService.getWelcomeMessage(ctx.user.username);

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(welcome)
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: 'Powered by Shardix Framework' });

    const button = new ButtonBuilder()
      .setCustomId('ping_again')
      .setLabel('Ping Again')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    return ctx.reply({
      embeds: [embed.toJSON()],
      components: [row.toJSON()],
    });
  }

  @Button('ping_again')
  async onPingAgain(ctx: CommandContext) {
    return ctx.reply({ content: '🏓 Pong again!', ephemeral: true });
  }

  @SlashCommand({
    name: 'hello',
    description: 'Says hello with an embed',
  })
  async hello(ctx: CommandContext) {
    const embed = new EmbedBuilder()
      .setTitle('👋 Hello!')
      .setDescription(\`Hello \${ctx.user.username}! I am your Shardix-powered bot.\`)
      .setColor(0x57f287)
      .setTimestamp();

    return ctx.reply({ embeds: [embed.toJSON()] });
  }

  @On('ready')
  onReady(client: any) {
    console.log(\`✅ Bot logged in as \${client?.user?.tag || 'Unknown'}\`);
  }

  @On('guildMemberAdd')
  onMemberJoin(member: any) {
    console.log(\`[EVENT] New member joined: \${member?.user?.username || 'Unknown'}\`);
  }
}
`;
  fs.writeFileSync(path.join(srcDir, 'ping.controller.ts'), pingControllerContent);

  // ─── 8. src/main.ts ─────────────────────────────────────────────────────────
  const mainTsContent = `import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { ShardixFactory } from '@shardix/core';
import { ${selectedClass.className} } from '${selectedClass.importPath}';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.DISCORD_TOKEN) {
    console.error('❌ Missing DISCORD_TOKEN in .env file!');
    process.exit(1);
  }

  const adapter = new ${selectedClass.className}();

  const app = await ShardixFactory.create({
    adapter,
  });

  app.register(AppModule);

  await app.start();
  console.log('🚀 ${projectName} is online!');
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
`;
  fs.writeFileSync(path.join(srcDir, 'main.ts'), mainTsContent);

  // ─── 9. src/register-commands.ts ─────────────────────────────────────────────
  // Script to register slash commands with Discord API
  const registerCommandsContent = `import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { ShardixFactory } from '@shardix/core';
import { ${selectedClass.className} } from '${selectedClass.importPath}';
import { AppModule } from './app.module.js';

// Commands to register (must match your @SlashCommand decorators)
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong and bot status!',
  },
  {
    name: 'hello',
    description: 'Says hello with an embed',
  },
];

async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in .env');
    process.exit(1);
  }

  try {
    const { REST, Routes } = require('${selectedAdapter.client === 'discord.js' ? 'discord.js' : selectedAdapter.client}');
    const rest = new REST({ version: '10' }).setToken(token);

    console.log('📡 Registering slash commands...');

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(\`✅ Registered \${commands.length} guild commands in \${guildId}\`);
      console.log('ℹ️  Guild commands update instantly!');
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(\`✅ Registered \${commands.length} global commands\`);
      console.log('ℹ️  Global commands may take up to 1 hour to propagate');
    }
  } catch (err: any) {
    console.error('❌ Failed to register commands:', err?.message || err);
    process.exit(1);
  }
}

registerCommands();
`;
  fs.writeFileSync(path.join(srcDir, 'register-commands.ts'), registerCommandsContent);

  // ─── 10. README.md ──────────────────────────────────────────────────────────
  const readmeContent = `# ${projectName}

> Discord bot built with **[Shardix Framework](https://shardix.dev)** — Enterprise architecture for Discord applications.

## Quick Start

### 1. Install dependencies
\`\`\`bash
${packageManager} install
\`\`\`

### 2. Configure your bot
Edit \`.env\` and fill in your Discord bot credentials:
\`\`\`env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_test_server_id  # optional, for instant command updates
\`\`\`

### 3. Register slash commands
\`\`\`bash
${packageManager} run register-commands
\`\`\`

### 4. Run the bot
\`\`\`bash
${packageManager} run dev
\`\`\`

## Project Structure
\`\`\`
src/
├── app.module.ts          # Root module (DI registration)
├── main.ts                # Application entry point
├── register-commands.ts   # Slash command registration script
├── ping.controller.ts     # Commands & event handlers
└── user.service.ts        # Business logic service
\`\`\`

## Commands
| Command | Description |
|---------|-------------|
| \`/ping\` | Replies with Pong and bot status |
| \`/hello\` | Says hello with an embed |

## Built With
- 🚀 [Shardix Framework](https://shardix.dev) — Enterprise bot architecture
- 🔷 ${adapter === 'discordjs' ? '[Discord.js](https://discord.js.org)' : adapter} — Discord library
`;
  fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent);

  // ─── 11. Dockerfile (optional) ──────────────────────────────────────────────
  if (options.docker !== false) {
    const dockerfileContent = `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD node -e "process.exit(0)" || exit 1

CMD ["node", "dist/main.js"]
`;
    fs.writeFileSync(path.join(projectDir, 'Dockerfile'), dockerfileContent);

    const dockerComposeContent = `version: '3.8'
services:
  bot:
    build: .
    environment:
      - DISCORD_TOKEN=\${DISCORD_TOKEN}
      - CLIENT_ID=\${CLIENT_ID}
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./.env:/app/.env:ro
`;
    fs.writeFileSync(path.join(projectDir, 'docker-compose.yml'), dockerComposeContent);
  }

  return projectDir;
}

function detectPackageManager(): 'npm' | 'pnpm' | 'yarn' | 'bun' {
  try {
    const userAgent = process.env.npm_config_user_agent || '';
    if (userAgent.includes('pnpm')) return 'pnpm';
    if (userAgent.includes('yarn')) return 'yarn';
    if (userAgent.includes('bun')) return 'bun';
  } catch {}
  return 'npm';
}

export function installDependencies(projectDir: string, packageManager: string): void {
  const installCmd = packageManager === 'yarn' ? 'yarn' : `${packageManager} install`;
  console.log(pc.cyan(`\n📦 Installing dependencies with ${packageManager}...`));
  try {
    execSync(installCmd, { cwd: projectDir, stdio: 'inherit' });
    console.log(pc.green('✔ Dependencies installed successfully!'));
  } catch (err: any) {
    console.error(pc.red(`Failed to install dependencies: ${err?.message || err}`));
    console.log(pc.yellow(`Run \`${installCmd}\` manually in the project directory.`));
  }
}
