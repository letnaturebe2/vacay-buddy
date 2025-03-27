import 'reflect-metadata';
import { config } from 'dotenv';

config();

import { App, type Context, LogLevel } from '@slack/bolt';
import { dataSource } from './db';
import type { Team } from './entity/team.model';
import type { User } from './entity/user.model';
import registerListeners from './listeners';
import registerMiddleware from './middleware';

export interface AppContext extends Context {
  locale: string;
  team: Team;
  user: User;
}

// const receiver = new ExpressReceiver({
//   signingSecret: process.env.SLACK_SIGNING_SECRET || '',
// });
//
// // Simple HTML endpoint example
// receiver.app.get('/', (req: Request, res: Response) => {
//   const html = `
//     <!DOCTYPE html>
//     <html lang="en">
//       <head><title>Hello Slack App!!!</title></head>
//       <body><h1>Hello from Slack App@@@</h1></body>
//     </html>
//   `;
//
//   res.set('Content-Type', 'text/html');
//   res.send(html);
// });

// create post endpoint for interactive components
// receiver.router.post('/slack/events', async (req, res) => {
//   receiver.app.handle(req, res);
// });

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  // receiver,
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
