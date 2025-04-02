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
export const LOCALE_TO_LANG: Readonly<Record<string, string>> = {
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

export enum PTO_TEMPLATE_KEY {
  FULL_DAY_TITLE = 'template_full_day_title',
  MORNING_HALF_DAY_TITLE = 'template_morning_half_day_title',
  AFTERNOON_HALF_DAY_TITLE = 'template_afternoon_half_day_title',
  SICK_LEAVE_TITLE = 'template_sick_leave_title',
  SICK_LEAVE_DESC = 'template_sick_leave_desc',
  REWARD_LEAVE_TITLE = 'template_reward_leave_title',
  REWARD_LEAVE_DESC = 'template_reward_leave_desc',
}

export enum PtoTemplateManageType {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}

export const INVALID_USER_IDS = ['USLACKBOT'];
