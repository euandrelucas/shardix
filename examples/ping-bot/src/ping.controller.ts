import {
  Autocomplete,
  Button,
  Controller,
  Injectable,
  Modal,
  SlashCommand,
} from '@shardix/common';

@Injectable()
export class PingService {
  getPongText(): string {
    return 'Pong! Response generated via Shardix HttpRuntime ⚡';
  }
}

@Controller()
export class PingController {
  constructor(private pingService: PingService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Responds with pong and interactive components',
  })
  async onPing() {
    return {
      type: 4,
      data: {
        content: this.pingService.getPongText(),
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Trigger Button',
                style: 1,
                custom_id: 'btn_ping_action',
              },
            ],
          },
        ],
      },
    };
  }

  @Button('btn_ping_action')
  async onButton() {
    return {
      type: 9, // Modal response type
      data: {
        custom_id: 'modal_ping_feedback',
        title: 'Ping Feedback Modal',
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'input_feedback',
                label: 'Your Feedback',
                style: 1,
              },
            ],
          },
        ],
      },
    };
  }

  @Modal('modal_ping_feedback')
  async onModalSubmit(payload: any) {
    return {
      type: 4,
      data: {
        content: 'Thank you for submitting feedback via Shardix Modal! 🎉',
      },
    };
  }

  @Autocomplete('ping', 'option')
  async onAutocomplete() {
    return {
      type: 8,
      data: {
        choices: [
          { name: 'Fast Ping', value: 'fast' },
          { name: 'Detailed Ping', value: 'detailed' },
        ],
      },
    };
  }
}
