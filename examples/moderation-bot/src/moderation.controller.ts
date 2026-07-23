import {
  Controller,
  Event,
  SlashCommand,
  UseGuards,
} from '@shardix/common';
import { ModerationService } from './moderation.service.js';
import { AdminGuard } from './moderation.guard.js';

@Controller()
@UseGuards(AdminGuard)
export class ModerationController {
  constructor(private modService: ModerationService) {}

  @SlashCommand({ name: 'ban', description: 'Ban a user' })
  async ban(payload: any) {
    const msg = this.modService.banUser(payload.data?.options?.[0]?.value || 'user_123', 'Admin');
    return { type: 4, data: { content: msg } };
  }

  @SlashCommand({ name: 'kick', description: 'Kick a user' })
  async kick(payload: any) {
    const msg = this.modService.kickUser(payload.data?.options?.[0]?.value || 'user_123', 'Admin');
    return { type: 4, data: { content: msg } };
  }

  @SlashCommand({ name: 'timeout', description: 'Timeout a user' })
  async timeout(payload: any) {
    const msg = this.modService.timeoutUser('user_123', 10, 'Admin');
    return { type: 4, data: { content: msg } };
  }

  @SlashCommand({ name: 'purge', description: 'Purge messages' })
  async purge(payload: any) {
    const msg = this.modService.purgeMessages(50, 'Admin');
    return { type: 4, data: { content: msg } };
  }

  @SlashCommand({ name: 'slowmode', description: 'Set slowmode' })
  async slowmode(payload: any) {
    const msg = this.modService.setSlowmode(5, 'Admin');
    return { type: 4, data: { content: msg } };
  }

  @SlashCommand({ name: 'lock', description: 'Lock channel' })
  async lock(payload: any) {
    const msg = this.modService.lockChannel('Admin');
    return { type: 4, data: { content: msg } };
  }

  @Event('guildMemberAdd')
  onMemberJoin(member: any) {
    console.log(`[EVENT] New member joined: ${member?.user?.username}`);
  }
}
