import type { App } from '@slack/bolt';
import appHomeOpenedCallback from './app-home-opened';
import appUninstalledCallback from './app-uninstalled';
import fileShared from './file-shared';

const register = (app: App) => {
  app.event('app_home_opened', appHomeOpenedCallback);
  app.event('app_uninstalled', appUninstalledCallback);
  app.event('file_shared', fileShared);
};

export default { register };
