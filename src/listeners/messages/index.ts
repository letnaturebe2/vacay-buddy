import type { App } from '@slack/bolt';
import sendWelcomeMessage from './send-welcome-message';

const register = (app: App) => {
  app.message(/.*/, sendWelcomeMessage);
};

export default { register };
