import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import { openAdminModal } from './open-admin-modal';
import { openPtoModal } from './open-pto-modal';
import { updateAdminPage } from './update-admin-page';
import { updateBackToHome } from './update-back-to-home';

const register = (app: App) => {
  app.action(ActionId.UPDATE_BACK_TO_HOME, updateBackToHome);
  app.action(ActionId.UPDATE_ADMIN_PAGE, updateAdminPage);
  app.action(ActionId.OPEN_ADMIN_MODAL, openAdminModal);
  app.action(ActionId.OPEN_PTO_MODAL, openPtoModal);
};

export default { register };
