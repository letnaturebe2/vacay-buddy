import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import { openAdminModal } from './open-admin-modal';
import { openPtoManageTemplateModal } from './open-pto-manage-template-modal';
import { openPtoRequestModal } from './open-pto-request-modal';
import { updateAdminPage } from './update-admin-page';
import { updateBackToHome } from './update-back-to-home';
import {selectPtoTemplate} from "./select-pto-template";

const register = (app: App) => {
  app.action(ActionId.UPDATE_BACK_TO_HOME, updateBackToHome);
  app.action(ActionId.UPDATE_ADMIN_PAGE, updateAdminPage);
  app.action(ActionId.OPEN_ADMIN_MODAL, openAdminModal);
  app.action(ActionId.OPEN_PTO_MANAGE_MODAL, openPtoManageTemplateModal);
  app.action(ActionId.OPEN_PTO_REQUEST_MODAL, openPtoRequestModal);
  app.action(ActionId.SELECT_PTO_TEMPLATE, selectPtoTemplate);
};

export default { register };
