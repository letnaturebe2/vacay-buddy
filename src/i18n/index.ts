import i18next from 'i18next';
import { LOCALE_TO_LANG } from '../constants';
import enUS from './en-US';
import koKR from './ko-KR';

// Create a promise for initialization
export const i18nInitPromise = i18next.init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  resources: {
    'en-US': { translation: enUS },
    'ko-KR': { translation: koKR },
  },
  interpolation: {
    escapeValue: false,
  },
});

export function t(locale: keyof typeof LOCALE_TO_LANG, key: string, params?: Record<string, string>) {
  return i18next.t(key, {
    lng: locale,
    ...params,
  });
}

// Export i18next for direct access if needed
export { i18next };
