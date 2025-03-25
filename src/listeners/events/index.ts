import type { App } from '@slack/bolt';
import appHomeOpenedCallback from './app-home-opened';
import file_shared from './file_shared';

const register = (app: App) => {
  app.event('app_home_opened', appHomeOpenedCallback);
  app.event('file_shared', file_shared);
};

export default { register };
