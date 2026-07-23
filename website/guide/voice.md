# Voice Foundation & Audio Engine

Shardix includes voice session contracts (`VoiceConnection`, `AudioPlayer`, `AudioQueue`) for audio processing.

---

## 🔊 Voice Connection

```typescript
import { VoiceConnection } from '@shardix/core';

const conn = new VoiceConnection('guild_123', 'channel_456');
conn.player.play({ streamUrl: 'https://stream.example.com/audio.mp3' });
```
