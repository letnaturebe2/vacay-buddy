import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import submitAdminManage from './submit-admin-manage';

const register = (app: App) => {
  app.view(ActionId.SUBMIT_ADMIN_MANAGE, submitAdminManage);
};

export default { register };
