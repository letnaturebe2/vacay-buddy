import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import handleConfigureSubmit from './callback-configure-submit';
import sampleViewCallback from './sample-view';

const register = (app: App) => {
  app.view('sample_view_id', sampleViewCallback);
  app.view(ActionId.CONFIGURE, handleConfigureSubmit);
};

export default { register };
