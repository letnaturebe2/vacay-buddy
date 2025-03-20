export enum ActionId {
  UPDATE_BACK_TO_HOME = 'back-to-home',
  // admin actions
  UPDATE_ADMIN_PAGE = 'admin-page',
  OPEN_ADMIN_MODAL = 'open-admin-modal',
  SUBMIT_ADMIN_MANAGE = 'submit-admin-manage',
  SUBMIT_PTO_TEMPLATE_MANAGE = 'submit-pto-template-manage',
  // pto actions
  OPEN_PTO_MANAGE_MODAL = 'open-pto-manage-modal',
  OPEN_PTO_REQUEST_MODAL = 'open-pto-request-modal',
  SELECT_PTO_TEMPLATE = 'select-pto-template',
  SUBMIT_PTO_REQUEST = 'submit-pto-request',
}

export enum PtoRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
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

const DEFAULT_TEMPLATE = [
  {name: 'Full-day PTO', status: ':white_check_mark: Enabled', description: 'Take a full day off'},
  {
    name: 'Half-day Morning PTO',
    status: ':white_check_mark: Enabled',
    description: 'Take a half day off in the morning',
  },
  {
    name: 'Half-day Afternoon PTO',
    status: ':x: Disabled',
    description:
      'Take a half day off in the afternoon, starting after lunch and ending at the close of business hours',
  },
];

export enum PtoTemplateManageType {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}

export const DEFAULT_PTO_TEMPLATE_TITLE = 'PTO';
export const DEFAULT_PTO_TEMPLATE_CONTENT = '📅 Date Range: YYYY/MM/DD - YYYY/MM/DD\n📝 Reason: ';