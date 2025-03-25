import { PtoTemplate } from './entity/pto-template.model';

export enum ActionId {
  // admin actions
  UPDATE_BACK_TO_HOME = 'back-to-home',
  UPDATE_ADMIN_PAGE = 'admin-page',
  OPEN_ADMIN_MODAL = 'open-admin-modal',
  SUBMIT_ADMIN_MANAGE = 'submit-admin-manage',
  SUBMIT_PTO_TEMPLATE_MANAGE = 'submit-pto-template-manage',
  // pto actions
  OPEN_PTO_MANAGE_MODAL = 'open-pto-manage-modal',
  OPEN_PTO_REQUEST_MODAL = 'open-pto-request-modal',
  SELECT_PTO_TEMPLATE = 'select-pto-template',
  SUBMIT_PTO_REQUEST = 'submit-pto-request',
  OPEN_PTO_APPROVAL_MODAL = 'open-pto-approval-modal',
  OPEN_DECISION_MODAL = 'open-decision-modal',
  OPEN_MY_REQUEST_STATUS_MODAL = 'open-my-request-status-modal',
  SUBMIT_DECISION_REQUEST = 'submit-decision-request',
}

export enum PtoRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

// noinspection JSUnusedGlobalSymbols
export const LOCALE_TO_LANG: Record<string, string> = {
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

export const DEFAULT_PTO_TEMPLATE_TITLE = 'PTO';
export const DEFAULT_PTO_TEMPLATE_CONTENT = '📋 Leave Request Details: \n - Reason: \n';

export const DEFAULT_TEMPLATE: Partial<PtoTemplate>[] = [
  {
    title: 'Full-day Leave',
    description: 'Take a full day off',
    daysConsumed: 1.0,
    content: DEFAULT_PTO_TEMPLATE_CONTENT,
  },
  {
    title: 'Morning Half-day Leave',
    description: 'Take the morning off',
    daysConsumed: 0.5,
    content: DEFAULT_PTO_TEMPLATE_CONTENT,
  },
  {
    title: 'Afternoon Half-day Leave',
    description: 'Take the afternoon off',
    daysConsumed: 0.5,
    content: DEFAULT_PTO_TEMPLATE_CONTENT,
  },
  {
    title: 'Sick Leave',
    description: 'Leave due to illness',
    daysConsumed: 1.0,
    content: DEFAULT_PTO_TEMPLATE_CONTENT,
  },
  {
    title: 'Reward Leave',
    description: 'Special leave granted as a reward',
    daysConsumed: 0.0,
    content: DEFAULT_PTO_TEMPLATE_CONTENT,
  },
];

export enum PtoTemplateManageType {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}
