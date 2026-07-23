# Fundação de Voz & Motor de Áudio

O Shardix inclui modelos desacoplados para gerenciamento de sessões de voz (`VoiceConnection`, `AudioPlayer`, `AudioQueue`).

---

## 🔊 Conexão de Voz

```typescript
import { VoiceConnection } from '@shardix/core';

const conn = new VoiceConnection('guild_123', 'channel_456');
conn.player.play({ streamUrl: 'https://stream.example.com/audio.mp3' });
```
