import { PTO_TEMPLATE_KEY, PtoRequestStatus } from './constants';
import { PtoRequest } from './entity/pto-request.model';
import { PtoTemplate } from './entity/pto-template.model';
import { User } from './entity/user.model';
import { t } from './i18n';

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assert400(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new HttpError(400, message);
  }
}

export function assert401(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new HttpError(401, message);
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

export const getRequestStatus = (request: PtoRequest): [string, string] => {
  const today = new Date();

  let statusClass = '';
  let statusText = '';

  if (request.status === PtoRequestStatus.Approved) {
    if (request.endDate < today) {
      statusClass = 'status-completed';
      statusText = '완료';
    } else if (request.startDate <= today && request.endDate >= today) {
      statusClass = 'status-ongoing';
      statusText = '진행 중';
    } else {
      statusClass = 'status-scheduled';
      statusText = '예정';
    }
  } else if (request.status === PtoRequestStatus.Rejected) {
    statusClass = 'status-rejected';
    statusText = '거부됨';
  } else {
    statusClass = 'status-pending';
    statusText = '대기 중';
  }

  return [statusClass, statusText];
};
