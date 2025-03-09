import {OpenAI} from 'openai';
import type {GptContext} from './app';

const _translation_result_cache: { [key: string]: string } = {};

const fromLocaleToLang = (locale: string): string | null => {
  const locale_to_lang: Record<string, string> = {
    'en-US': 'English',
    'en-GB': 'English',
    'de-DE': 'German',
    'es-ES': 'Spanish',
    'es-LA': 'Spanish',
    'fr-FR': 'French',
    'it-IT': 'Italian',
    'pt-BR': 'Portuguese',
    'ru-RU': 'Russian',
    'ja-JP': 'Japanese',
    'zh-CN': 'Chinese',
    'zh-TW': 'Chinese',
    'ko-KR': 'Korean',
  };

  return locale_to_lang[locale] || null;
};

const translate = async (openaiApiKey: string, context: GptContext, text: string): Promise<string> => {
  if (!openaiApiKey.trim()) {
    return text;
  }

  const lang = fromLocaleToLang(context.locale);
  if (!lang || lang === 'English') {
    return text;
  }

  const cacheKey = `${lang}:${text}`;
  if (_translation_result_cache[cacheKey]) {
    return _translation_result_cache[cacheKey];
  }

  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          "You're an AI that specializes in high-quality language translation. " +
          "Always return only the translated text, keeping Slack's emoji (e.g., :hourglass_flowing_sand:) " +
          'and mention formats unchanged. ' +
          'Maintain markdown formatting as much as possible.',
      },
      {
        role: 'user',
        content: `Translate the following text into ${lang}professionally.
           Do not include English explanations or pronunciation guides. Original text:\n${text}`,
      },
    ],
    top_p: 1,
    n: 1,
    max_tokens: 1024,
    temperature: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
  });

  const translatedText = response.choices[0]?.message?.content?.trim() || text;
  _translation_result_cache[cacheKey] = translatedText;

  return translatedText;
};

export default translate;
