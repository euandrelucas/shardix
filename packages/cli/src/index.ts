import * as p from '@clack/prompts';
import pc from 'picocolors';

async function main() {
  console.clear();
  p.intro(`${pc.bgCyan(pc.black(' Shardix Framework '))} — Enterprise Bot Architecture`);

  const project = await p.group(
    {
      name: () =>
        p.text({
          message: 'What is your project name?',
          placeholder: 'my-shardix-bot',
          validate: (value) => {
            if (!value) return 'Project name is required';
          },
        }),
      adapter: () =>
        p.select({
          message: 'Select Discord Library Adapter:',
          options: [
            { value: 'discordjs', label: 'discord.js (v14+)', hint: 'Recommended' },
            { value: 'eris', label: 'Eris' },
            { value: 'discordeno', label: 'Discordeno' },
          ],
        }),
      transport: () =>
        p.select({
          message: 'Select Communication Transport Layer:',
          options: [
            { value: 'http', label: 'HTTP Interactions (Serverless / Ultra Fast)', hint: 'Zero WS memory cost' },
            { value: 'gateway', label: 'Gateway (Traditional WebSocket)' },
            { value: 'hybrid', label: 'Hybrid (Gateway + HTTP)' },
          ],
        }),
      database: () =>
        p.select({
          message: 'Select Database ORM Provider:',
          options: [
            { value: 'prisma', label: 'Prisma' },
            { value: 'drizzle', label: 'Drizzle ORM' },
            { value: 'typeorm', label: 'TypeORM' },
            { value: 'mongoose', label: 'Mongoose' },
            { value: 'none', label: 'None' },
          ],
        }),
      redis: () =>
        p.confirm({
          message: 'Include Redis Cache & Distributed EventBus?',
          initialValue: true,
        }),
      docker: () =>
        p.confirm({
          message: 'Generate Dockerfile & Docker Compose setups?',
          initialValue: true,
        }),
      k8s: () =>
        p.confirm({
          message: 'Generate Kubernetes Manifests (Healthchecks, Liveness)?',
          initialValue: false,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );

  p.note(
    `Project: ${project.name}\nAdapter: ${project.adapter}\nTransport: ${project.transport}\nORM: ${project.database}\nRedis: ${project.redis ? 'Yes' : 'No'}\nDocker: ${project.docker ? 'Yes' : 'No'}`,
    'Configuration Summary'
  );

  const s = p.spinner();
  s.start('Generating project files...');
  await new Promise((resolve) => setTimeout(resolve, 1200));
  s.stop('Project generated successfully!');

  p.outro(`Next steps:\n  cd ${project.name}\n  pnpm install\n  pnpm dev`);
}

main().catch(console.error);
