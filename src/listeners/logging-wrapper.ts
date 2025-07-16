import type {
  AllMiddlewareArgs,
  SlackActionMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SlackViewMiddlewareArgs,
} from '@slack/bolt';
import { logBusinessEvent } from '../logger';

type ActionArgs = AllMiddlewareArgs & SlackActionMiddlewareArgs;
type EventArgs = AllMiddlewareArgs & SlackEventMiddlewareArgs;
type ViewArgs = AllMiddlewareArgs & SlackViewMiddlewareArgs;

const extractContext = (args: ActionArgs | EventArgs | ViewArgs) => {
  const { context, body } = args;
  return {
    userId: context.userId || body.user?.id,
    organizationId: context.teamId || context.enterpriseId,
  };
};

// Action 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by action
export const withActionLogging = (actionId: string, handler: any) => {
  return async (args: ActionArgs) => {
    const context = extractContext(args);

    logBusinessEvent('Slack action executed', {
      type: 'action',
      actionId,
      ...context,
    });

    return await handler(args);
  };
};

// Event 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by event
export const withEventLogging = (eventType: string, handler: any) => {
  return async (args: EventArgs) => {
    const context = extractContext(args);

    logBusinessEvent('Slack event received', {
      type: 'event',
      eventType,
      ...context,
    });

    return await handler(args);
  };
};

// View 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by view
export const withViewLogging = (viewId: string, handler: any) => {
  return async (args: ViewArgs) => {
    const context = extractContext(args);

    logBusinessEvent('Slack view submitted', {
      type: 'view',
      viewId,
      ...context,
    });

    return await handler(args);
  };
};

// Command 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by command
export const withCommandLogging = (command: string, handler: any) => {
  // biome-ignore lint/suspicious/noExplicitAny: Command args type varies significantly
  return async (args: any) => {
    const context = extractContext(args);

    logBusinessEvent('Slack command executed', {
      type: 'command',
      command,
      ...context,
    });

    return await handler(args);
  };
};
