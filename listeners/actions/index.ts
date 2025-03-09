import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import {updateBackToHome} from "./update-back-to-home";
import {updateAdminPage} from "./update-admin-page";
import {openManageAdminModal} from "./open-manage-admin-modal";

const register = (app: App) => {
  app.action(ActionId.UPDATE_BACK_TO_HOME, updateBackToHome);
  app.action(ActionId.UPDATE_ADMIN_PAGE, updateAdminPage);
  app.action(ActionId.OPEN_ADMIN_MANAGE, openManageAdminModal);
};

export default { register };
