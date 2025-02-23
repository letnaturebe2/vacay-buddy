import type { App } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import handleConfigureSubmit from './callback-configure-submit';
import handleProofreadingSubmit from './callback-proofreading-submit';
import sampleViewCallback from './sample-view';

const register = (app: App) => {
  app.view('sample_view_id', sampleViewCallback);
  app.view(ActionId.CONFIGURE, handleConfigureSubmit);
  app.view(ActionId.PROOFREAD, handleProofreadingSubmit);
};

export default { register };
