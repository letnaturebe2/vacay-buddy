import 'reflect-metadata';
import * as dotenv from 'dotenv';

dotenv.config();

import {type AllMiddlewareArgs, App, type Context, LogLevel} from '@slack/bolt';
import {PROJECT_CONFIG} from './config/constants';
import {dataSource} from './config/db';
import registerListeners from './listeners';

export interface GptContext extends Context {
  locale: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_IMAGE_GENERATION_MODEL: string;
  OPENAI_TEMPERATURE: number;
  OPENAI_ORG_ID: string | null;
  OPENAI_FUNCTION_CALL_MODULE_NAME?: string | null;
}

// middlewares
const setLocale = async ({context, client, next}: AllMiddlewareArgs<GptContext>) => {
  try {
    const userId = context.userId;
    if (userId) {
      const result = await client.users.info({
        user: userId,
        include_locale: true,
      });
      context.locale = result.user?.locale ?? 'en-US';
    }
    await next();
  } catch (error) {
    console.error('Error setting locale:', error);
    await next();
  }
};

const setOpenAIConfig = async ({context, next}: AllMiddlewareArgs<GptContext>) => {
  try {
    context.OPENAI_API_KEY = PROJECT_CONFIG.OPENAI_API_KEY;
    context.OPENAI_MODEL = PROJECT_CONFIG.OPENAI_MODEL;
    context.OPENAI_IMAGE_GENERATION_MODEL = PROJECT_CONFIG.OPENAI_IMAGE_GENERATION_MODEL;
    context.OPENAI_TEMPERATURE = Number(PROJECT_CONFIG.OPENAI_TEMPERATURE);
    context.OPENAI_ORG_ID = PROJECT_CONFIG.OPENAI_ORG_ID;
    context.OPENAI_FUNCTION_CALL_MODULE_NAME = PROJECT_CONFIG.OPENAI_FUNCTION_CALL_MODULE_NAME;
    await next();
  } catch (error) {
    console.error('Error setting OpenAI config:', error);
    await next();
  }
};

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
});

// Register middlewares
if (PROJECT_CONFIG.USE_SLACK_LANGUAGE) {
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
