import * as dotenv from 'dotenv';

dotenv.config();
import registerListeners from './listeners';
import {App, Context, AllMiddlewareArgs, LogLevel} from '@slack/bolt';
import {DEFAULT_SYSTEM_TEXT} from "./constants";

const config = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_SYSTEM_TEXT: process.env.OPENAI_SYSTEM_TEXT || DEFAULT_SYSTEM_TEXT,
  OPENAI_TIMEOUT_SECONDS: parseInt(process.env.OPENAI_TIMEOUT_SECONDS || '30'),
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  OPENAI_IMAGE_GENERATION_MODEL: process.env.OPENAI_IMAGE_GENERATION_MODEL || 'dall-e-3',
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '1'),
  OPENAI_ORG_ID: process.env.OPENAI_ORG_ID || null,
  OPENAI_FUNCTION_CALL_MODULE_NAME: process.env.OPENAI_FUNCTION_CALL_MODULE_NAME || null,
  USE_SLACK_LANGUAGE: process.env.USE_SLACK_LANGUAGE !== 'false',
  SLACK_APP_LOG_LEVEL: process.env.SLACK_APP_LOG_LEVEL || 'DEBUG',
  TRANSLATE_MARKDOWN: process.env.TRANSLATE_MARKDOWN === 'true',
  REDACTION_ENABLED: process.env.REDACTION_ENABLED === 'true',
  IMAGE_FILE_ACCESS_ENABLED: process.env.IMAGE_FILE_ACCESS_ENABLED === 'true',
  REDACT_EMAIL_PATTERN: process.env.REDACT_EMAIL_PATTERN || '\\b[A-Za-z0-9.*%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
  REDACT_PHONE_PATTERN: process.env.REDACT_PHONE_PATTERN || '\\(?\\d{3}\\)?[-\.\\s]?\\d{3}[-\.\\s]?\\d{4}\\b',
  REDACT_CREDIT_CARD_PATTERN: process.env.REDACT_CREDIT_CARD_PATTERN || '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
  REDACT_SSN_PATTERN: process.env.REDACT_SSN_PATTERN || '\\b\\d{3}[- ]?\\d{2}[- ]?\\d{4}\\b',
  REDACT_USER_DEFINED_PATTERN: process.env.REDACT_USER_DEFINED_PATTERN || '(?!)'
};

// Custom context interface
export interface GptContext extends Context {
  locale: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_IMAGE_GENERATION_MODEL: string;
  OPENAI_TEMPERATURE: number;
  OPENAI_ORG_ID: string | null;
  OPENAI_FUNCTION_CALL_MODULE_NAME?: string | null;
}

const setLocale = async ({context, client, next}: AllMiddlewareArgs<GptContext>) => {
  try {
    const userId = context.userId;
    if (userId) {
      const result = await client.users.info({
        user: userId,
        include_locale: true
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
    context.OPENAI_API_KEY = config.OPENAI_API_KEY;
    context.OPENAI_MODEL = config.OPENAI_MODEL;
    context.OPENAI_IMAGE_GENERATION_MODEL = config.OPENAI_IMAGE_GENERATION_MODEL;
    context.OPENAI_TEMPERATURE = Number(config.OPENAI_TEMPERATURE);
    context.OPENAI_ORG_ID = config.OPENAI_ORG_ID;
    context.OPENAI_FUNCTION_CALL_MODULE_NAME = config.OPENAI_FUNCTION_CALL_MODULE_NAME;
    await next();
  } catch (error) {
    console.error('Error setting OpenAI config:', error);
    await next();
  }
};
/** Initialization */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
});

// Register middlewares
if (config.USE_SLACK_LANGUAGE) {
  app.use(setLocale);
}

app.use(setOpenAIConfig);

/** Register Listeners */
registerListeners(app);

/** Start Bolt App */
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    app.logger.info('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
