import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import submitAdminManage from './submit-admin-manage';
import submitPtoTemplateManage from './submit-pto-template-manage';

const register = (app: App) => {
  app.view(ActionId.SUBMIT_ADMIN_MANAGE, submitAdminManage);
  app.view(ActionId.SUBMIT_PTO_TEMPLATE_MANAGE, submitPtoTemplateManage);
};

export default { register };
