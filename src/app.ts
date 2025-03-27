import 'reflect-metadata';
import { config } from 'dotenv';

config();

import { App, type Context, LogLevel } from '@slack/bolt';
import { dataSource } from './db';
import type { Team } from './entity/team.model';
import type { User } from './entity/user.model';
import registerListeners from './listeners';
import registerMiddleware from './middleware';
import receiver from './receiver';

export interface AppContext extends Context {
  locale: string;
  team: Team;
  user: User;
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  logLevel: LogLevel.DEBUG,
});

/** Register listeners and middleware */
registerListeners(app);
registerMiddleware(app);

/** Start Bolt App */
(async () => {
  try {
    await dataSource.initialize();

    await app.start(process.env.PORT || 3000);

    app.logger.info('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
