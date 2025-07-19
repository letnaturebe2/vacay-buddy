import 'reflect-metadata';
import { config } from 'dotenv';

config();

import { App } from '@slack/bolt';
import { dataSource } from './db/db';
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
    // 시간 측정
    const startTime = Date.now();
    await i18nInitPromise;
    await dataSource.initialize();
    await app.start(process.env.PORT || 3000);
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    app.logger.info(`App initialized in ${elapsedTime}ms`);
    app.logger.info('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
