import type { App } from '@slack/bolt';
import { ActionId } from '../../constants';
import { openAdminModal } from './open-admin-modal';
import { openExcelInfoModal } from './open-excel-info-modal';
import { openPtoManageTemplateModal } from './open-pto-manage-template-modal';
import { openPtoRequestModal } from './open-pto-request-modal';
import { openRequestApproveModal } from './open-request-approve-modal';
import { selectPtoTemplate } from './select-pto-template';
import { updateAdminPage } from './update-admin-page';
import { updateBackToHome } from './update-back-to-home';

const register = (app: App) => {
  app.action(ActionId.UPDATE_BACK_TO_HOME, updateBackToHome);
  app.action(ActionId.UPDATE_ADMIN_PAGE, updateAdminPage);
  app.action(ActionId.OPEN_ADMIN_MODAL, openAdminModal);
  app.action(ActionId.OPEN_PTO_MANAGE_MODAL, openPtoManageTemplateModal);
  app.action(ActionId.OPEN_PTO_REQUEST_MODAL, openPtoRequestModal);
  app.action(ActionId.SELECT_PTO_TEMPLATE, selectPtoTemplate);
  app.action(ActionId.OPEN_DECISION_MODAL, openRequestApproveModal);
  app.action(ActionId.OPEN_EXCEL_INFO_MODAL, openExcelInfoModal);
  // this action is used to acknowledge for direct link
  app.action(ActionId.ACKNOWLEDGE, async ({ ack }) => {
    await ack();
  });
};

export default { register };
