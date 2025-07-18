import type { App } from '@slack/bolt';
import { ActionId } from '../../constants';
import { withViewLogging } from '../logging-wrapper';
import submitAdminManage from './submit-admin-manage';
import submitDecisionRequest from './submit-decision-request';
import submitPtoRequest from './submit-pto-request';
import submitPtoTemplateManage from './submit-pto-template-manage';

const register = (app: App) => {
  app.view(ActionId.SUBMIT_ADMIN_MANAGE, withViewLogging(ActionId.SUBMIT_ADMIN_MANAGE, submitAdminManage));
  app.view(
    ActionId.SUBMIT_PTO_TEMPLATE_MANAGE,
    withViewLogging(ActionId.SUBMIT_PTO_TEMPLATE_MANAGE, submitPtoTemplateManage),
  );
  app.view(ActionId.SUBMIT_PTO_REQUEST, withViewLogging(ActionId.SUBMIT_PTO_REQUEST, submitPtoRequest));
  app.view(ActionId.SUBMIT_DECISION_REQUEST, withViewLogging(ActionId.SUBMIT_DECISION_REQUEST, submitDecisionRequest));
};

export default { register };
