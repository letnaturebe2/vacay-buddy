import { PTO_TEMPLATE_KEY } from './constants';
import { PtoTemplate } from './entity/pto-template.model';
import { User } from './entity/user.model';
import { t } from './i18n';

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function formatToYYYYMMDD(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function showAdminSection(user: User, admins: User[]): boolean {
  return user.isAdmin || admins.length === 0;
}

export const getDefaultTemplates = (locale: string): Partial<PtoTemplate>[] => [
  {
    title: t(locale, PTO_TEMPLATE_KEY.FULL_DAY_TITLE),
    description: t(locale, PTO_TEMPLATE_KEY.FULL_DAY_TITLE),
    daysConsumed: 1.0,
    content: t(locale, 'default_pto_template_content'),
  },
  {
    title: t(locale, PTO_TEMPLATE_KEY.MORNING_HALF_DAY_TITLE),
    description: t(locale, PTO_TEMPLATE_KEY.MORNING_HALF_DAY_TITLE),
    daysConsumed: 0.5,
    content: t(locale, 'default_pto_template_content'),
  },
  {
    title: t(locale, PTO_TEMPLATE_KEY.AFTERNOON_HALF_DAY_TITLE),
    description: t(locale, PTO_TEMPLATE_KEY.AFTERNOON_HALF_DAY_TITLE),
    daysConsumed: 0.5,
    content: t(locale, 'default_pto_template_content'),
  },
  {
    title: t(locale, PTO_TEMPLATE_KEY.SICK_LEAVE_TITLE),
    description: t(locale, PTO_TEMPLATE_KEY.SICK_LEAVE_DESC),
    daysConsumed: 1.0,
    content: t(locale, 'default_pto_template_content'),
  },
  {
    title: t(locale, PTO_TEMPLATE_KEY.REWARD_LEAVE_TITLE),
    description: t(locale, PTO_TEMPLATE_KEY.REWARD_LEAVE_DESC),
    daysConsumed: 0.0,
    content: t(locale, 'default_pto_template_content'),
  },
];
