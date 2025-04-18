import type { App } from '@slack/bolt';
import appHomeOpenedCallback from './app-home-opened';
import fileShared from './file-shared';

const register = (app: App) => {
  app.event('app_home_opened', appHomeOpenedCallback);
  app.event('file_shared', fileShared);
};

export default { register };
