import { Button, Controller, Injectable, Module, SlashCommand } from '@shardix/common';

@Injectable()
export class PingService {
  getPong() {
    return 'Pong! Powered by Shardix HTTP Interactions 🚀';
  }
}

@Controller()
export class AppController {
  constructor(private pingService: PingService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Replies with pong using HTTP Interactions',
  })
  async ping() {
    return {
      type: 4,
      data: {
        content: this.pingService.getPong(),
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Click Me!',
                style: 1,
                custom_id: 'btn_click_me',
              },
            ],
          },
        ],
      },
    };
  }

  @Button('btn_click_me')
  async onButtonClick() {
    return {
      type: 4,
      data: {
        content: 'You clicked the HTTP interaction button! 🎉',
      },
    };
  }
}

@Module({
  controllers: [AppController],
  providers: [PingService],
})
export class AppModule {}
