import 'reflect-metadata';
import { config } from 'dotenv';

config();

import { type AllMiddlewareArgs, App, type Context, LogLevel } from '@slack/bolt';
import { dataSource } from './config/db';
import type { Team } from './entity/team';
import registerListeners from './listeners';
import { teamService } from './service/team.service';

export interface GptContext extends Context {
  locale: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_IMAGE_GENERATION_MODEL: string;
  OPENAI_TEMPERATURE: number;
  OPENAI_ORG_ID: string | null;
  OPENAI_FUNCTION_CALL_MODULE_NAME?: string | null;
  team: Team | null;
}

// middlewares
const setLocale = async ({ context, client, next }: AllMiddlewareArgs<GptContext>) => {
  const userId = context.userId;
  if (userId) {
    const result = await client.users.info({
      user: userId,
      include_locale: true,
    });
    context.locale = result.user?.locale ?? 'en-US';
  }
  await next();
};

const setOpenAIConfig = async ({ context, next }: AllMiddlewareArgs<GptContext>) => {
  const teamOrNull = await teamService.getTeam(context.teamId || '');
  context.team = teamOrNull;

  if (teamOrNull) {
    context.OPENAI_API_KEY = teamOrNull.api_key;
    context.OPENAI_MODEL = teamOrNull.model;
  } else {
    context.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    context.OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  context.OPENAI_IMAGE_GENERATION_MODEL = process.env.OPENAI_IMAGE_GENERATION_MODEL || 'dall-e-3';
  await next();
};

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
});

// Register middlewares
if (process.env.USE_SLACK_LANGUAGE !== 'false') {
  app.use(setLocale);
}
app.use(setOpenAIConfig);

/** Register Listeners */
registerListeners(app);

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
