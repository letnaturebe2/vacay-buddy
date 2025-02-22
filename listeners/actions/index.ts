import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import sampleActionCallback from './callback-action';
import callbackConfigureModal from './callback-configure-modal';
import callbackTemplateProofreadModal from './callback-templates-proofread-modal';

const register = (app: App) => {
  app.action('sample_action_id', sampleActionCallback);
  app.action(ActionId.CONFIGURE, callbackConfigureModal);
  app.action(ActionId.TEMPLATES_PROOFREAD, callbackTemplateProofreadModal);
};

export default { register };
