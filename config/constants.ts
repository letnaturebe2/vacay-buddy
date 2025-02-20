export enum ActionId {
  CONFIGURE = 'configure',
}

export const DEFAULT_SYSTEM_TEXT = `
    You are a bot in a slack chat room. You might receive messages from multiple people.
    Format bold text *like this*, italic text _like this_ and strikethrough text ~like this~.
    Slack user IDs match the regex \`<@U.*?>\`.
    Your Slack user ID is <@{bot_user_id}>.
    Each message has the author's Slack user ID prepended, like the regex \`^<@U.*?>: \` followed by the message text.
  `;

export const PROJECT_CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_SYSTEM_TEXT: process.env.OPENAI_SYSTEM_TEXT || DEFAULT_SYSTEM_TEXT,
  OPENAI_TIMEOUT_SECONDS: Number.parseInt(process.env.OPENAI_TIMEOUT_SECONDS || '30'),
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  OPENAI_IMAGE_GENERATION_MODEL: process.env.OPENAI_IMAGE_GENERATION_MODEL || 'dall-e-3',
  OPENAI_TEMPERATURE: Number.parseFloat(process.env.OPENAI_TEMPERATURE || '1'),
  OPENAI_ORG_ID: process.env.OPENAI_ORG_ID || null,
  OPENAI_FUNCTION_CALL_MODULE_NAME: process.env.OPENAI_FUNCTION_CALL_MODULE_NAME || null,
  USE_SLACK_LANGUAGE: process.env.USE_SLACK_LANGUAGE !== 'false',
  SLACK_APP_LOG_LEVEL: process.env.SLACK_APP_LOG_LEVEL || 'DEBUG',
  TRANSLATE_MARKDOWN: process.env.TRANSLATE_MARKDOWN === 'true',
  REDACTION_ENABLED: process.env.REDACTION_ENABLED === 'true',
  IMAGE_FILE_ACCESS_ENABLED: process.env.IMAGE_FILE_ACCESS_ENABLED === 'true',
  REDACT_EMAIL_PATTERN: process.env.REDACT_EMAIL_PATTERN || '\\b[A-Za-z0-9.*%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
  REDACT_PHONE_PATTERN: process.env.REDACT_PHONE_PATTERN || '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b',
  REDACT_CREDIT_CARD_PATTERN: process.env.REDACT_CREDIT_CARD_PATTERN || '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
  REDACT_SSN_PATTERN: process.env.REDACT_SSN_PATTERN || '\\b\\d{3}[- ]?\\d{2}[- ]?\\d{4}\\b',
  REDACT_USER_DEFINED_PATTERN: process.env.REDACT_USER_DEFINED_PATTERN || '(?!)',
};
