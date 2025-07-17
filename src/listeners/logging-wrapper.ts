import type {
  AllMiddlewareArgs,
  SlackActionMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SlackViewMiddlewareArgs,
} from '@slack/bolt';
import type { AppContext } from '../app';
import { logBusinessEvent } from '../logger';

type ActionArgs = AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs;
type EventArgs = AllMiddlewareArgs<AppContext> & SlackEventMiddlewareArgs;
type ViewArgs = AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs;

const formatLogMessage = (identifier: string, args: ActionArgs | EventArgs | ViewArgs) => {
  const { context } = args;
  const parts = [identifier];

  const userName = context.user?.name || '';
  const organizationName = context.organization?.name || '';

  if (userName && organizationName) {
    parts.push(`${userName} (${organizationName})`);
  } else if (userName) {
    parts.push(`${userName} (No Organization)`);
  } else if (organizationName) {
    parts.push(`(No User) ${organizationName}`);
  }

  return parts.join(', ');
};

// Action 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by action
export const withActionLogging = (actionId: string, handler: any) => {
  return async (args: ActionArgs) => {
    const message = formatLogMessage(actionId, args);
    logBusinessEvent(message);
    return await handler(args);
  };
};

// Event 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by event
export const withEventLogging = (eventType: string, handler: any) => {
  return async (args: EventArgs) => {
    const message = formatLogMessage(eventType, args);
    logBusinessEvent(message);
    return await handler(args);
  };
};

// View 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by view
export const withViewLogging = (viewId: string, handler: any) => {
  return async (args: ViewArgs) => {
    const message = formatLogMessage(viewId, args);
    logBusinessEvent(message);
    return await handler(args);
  };
};

// Command 로깅 래퍼
// biome-ignore lint/suspicious/noExplicitAny: Handler function type is dynamic and varies by command
export const withCommandLogging = (command: string, handler: any) => {
  // biome-ignore lint/suspicious/noExplicitAny: Command args type varies significantly
  return async (args: any) => {
    const message = formatLogMessage(command, args);
    logBusinessEvent(message);
    return await handler(args);
  };
};
