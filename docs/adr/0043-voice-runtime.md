# ADR 0043: Voice Runtime & Audio Engine

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Transmitir áudio em canais de voz do Discord desacoplado de soluções específicas de adaptador.

## Decisão

Adicionar `VoiceConnection`, `AudioPlayer` e `AudioQueue`.
