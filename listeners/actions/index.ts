import type { App } from '@slack/bolt';
import {ActionId} from "../../constants";
import sampleActionCallback from "./callback-action";
import callbackConfigure from "./callback-configure";

const register = (app: App) => {
  app.action('sample_action_id', sampleActionCallback);
  app.action(ActionId.CONFIGURE, callbackConfigure);
};

export default { register };
