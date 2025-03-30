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

export function t(key: string, params?: Record<string, string>, locale = 'en-US') {
  const finalLocale = locale in LOCALE_TO_LANG ? locale : 'en-US';
  return i18next.t(key, {
    lng: finalLocale,
    ...params,
  });
}

// Export i18next for direct access if needed
export { i18next };
