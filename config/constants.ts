export enum ActionId {
  UPDATE_BACK_TO_HOME = 'back-to-home',
  // admin actions
  UPDATE_ADMIN_PAGE = 'admin-page',
  OPEN_ADMIN_MODAL = 'open-admin-modal',
  SUBMIT_ADMIN_MANAGE = 'submit-admin-manage',
  // pto actions
  OPEN_PTO_MODAL = 'open-pto-modal',
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