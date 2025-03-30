import 'reflect-metadata';
import { config } from 'dotenv';

config();

import { App } from '@slack/bolt';
import { dataSource } from './db';
import { i18nInitPromise } from './i18n';
import registerListeners from './listeners';
import registerMiddleware from './middleware';
import receiver from './receiver';

const app = new App({
  receiver,
});

/** Register Listeners */
registerListeners(app);
registerMiddleware(app);

/** Start Bolt App */
(async () => {
  try {
    await i18nInitPromise;
    await dataSource.initialize();
    await app.start(process.env.PORT || 3000);
    app.logger.info('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
