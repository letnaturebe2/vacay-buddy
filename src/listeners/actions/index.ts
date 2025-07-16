import type { App } from '@slack/bolt';
import { ActionId } from '../../constants';
import { withActionLogging } from '../logging-wrapper';
import { openAdminModal } from './open-admin-modal';
import { openExcelInfoModal } from './open-excel-info-modal';
import { openPtoManageTemplateModal } from './open-pto-manage-template-modal';
import { openPtoRequestModal } from './open-pto-request-modal';
import { openRequestApproveModal } from './open-request-approve-modal';
import { selectPtoTemplate } from './select-pto-template';
import { updateAdminPage } from './update-admin-page';
import { updateBackToHome } from './update-back-to-home';

const register = (app: App) => {
  app.action(ActionId.UPDATE_BACK_TO_HOME, withActionLogging(ActionId.UPDATE_BACK_TO_HOME, updateBackToHome));
  app.action(ActionId.UPDATE_ADMIN_PAGE, withActionLogging(ActionId.UPDATE_ADMIN_PAGE, updateAdminPage));
  app.action(ActionId.OPEN_ADMIN_MODAL, withActionLogging(ActionId.OPEN_ADMIN_MODAL, openAdminModal));
  app.action(
    ActionId.OPEN_PTO_MANAGE_MODAL,
    withActionLogging(ActionId.OPEN_PTO_MANAGE_MODAL, openPtoManageTemplateModal),
  );
  app.action(ActionId.OPEN_PTO_REQUEST_MODAL, withActionLogging(ActionId.OPEN_PTO_REQUEST_MODAL, openPtoRequestModal));
  app.action(ActionId.SELECT_PTO_TEMPLATE, withActionLogging(ActionId.SELECT_PTO_TEMPLATE, selectPtoTemplate));
  app.action(ActionId.OPEN_DECISION_MODAL, withActionLogging(ActionId.OPEN_DECISION_MODAL, openRequestApproveModal));
  app.action(ActionId.OPEN_EXCEL_INFO_MODAL, withActionLogging(ActionId.OPEN_EXCEL_INFO_MODAL, openExcelInfoModal));
  app.action(ActionId.REFRESH_HOME, withActionLogging(ActionId.REFRESH_HOME, updateBackToHome));
};

export default { register };
