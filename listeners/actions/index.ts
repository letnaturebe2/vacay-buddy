import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import sampleActionCallback from './callback-action';
import callbackConfigureModal from './callback-configure-modal';
import handleConfigureSubmit from './callback-configure-submit';

const register = (app: App) => {
  app.action('sample_action_id', sampleActionCallback);
  app.action(ActionId.CONFIGURE, callbackConfigureModal);
  app.view(ActionId.CONFIGURE, handleConfigureSubmit);
};

export default { register };
