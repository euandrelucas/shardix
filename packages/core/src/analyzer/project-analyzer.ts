import { Type } from '@shardix/common';
import { ReflectionContainer } from '../reflection/reflection-container.js';

export interface AnalysisResult {
  gatewayEventsCount: number;
  interactionHandlersCount: number;
  recommendedRuntime: 'HttpRuntime' | 'GatewayRuntime' | 'HybridRuntime';
  suggestionMessage: string;
}

export class ProjectAnalyzer {
  public static analyze(controllers: Type<any>[]): AnalysisResult {
    let gatewayEventsCount = 0;
    let interactionHandlersCount = 0;

    for (const ctrl of controllers) {
      const meta = ReflectionContainer.reflect(ctrl);
      gatewayEventsCount += meta.events.length;
      interactionHandlersCount +=
        meta.slashCommands.length +
        meta.buttons.length +
        meta.modals.length +
        meta.autocompletes.length;
    }

    if (gatewayEventsCount === 0 && interactionHandlersCount > 0) {
      return {
        gatewayEventsCount,
        interactionHandlersCount,
        recommendedRuntime: 'HttpRuntime',
        suggestionMessage:
          '💡 [Shardix Analyzer] This project only uses interactions (Slash/Button/Modal). Using HttpRuntime is recommended to eliminate WebSocket overhead and reduce memory/CPU consumption.',
      };
    }

    if (gatewayEventsCount > 0 && interactionHandlersCount === 0) {
      return {
        gatewayEventsCount,
        interactionHandlersCount,
        recommendedRuntime: 'GatewayRuntime',
        suggestionMessage:
          '💡 [Shardix Analyzer] This project strictly listens to Gateway WebSocket events. Using GatewayRuntime is recommended.',
      };
    }

    return {
      gatewayEventsCount,
      interactionHandlersCount,
      recommendedRuntime: 'HybridRuntime',
      suggestionMessage:
        '💡 [Shardix Analyzer] This project uses both Gateway events and Interactions. HybridRuntime is recommended.',
    };
  }
}
