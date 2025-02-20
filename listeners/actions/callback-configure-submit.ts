import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { GptContext } from '../../app';
import { ActionId } from '../../config/constants';
import {teamService} from "../../service/team.service";

const handleConfigureSubmit = async ({
  ack,
  body,
  view,
  context,
  logger,
}: AllMiddlewareArgs<GptContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  try {
    await ack();

    const values = view.state.values;
    const apiKey = values.api_key?.input?.value;
    const selectedModel = values.model?.input?.selected_option?.value;
    const team = await teamService.upsertTeam(context.teamId!, apiKey!);
    logger.info(`Saved API Key: ${apiKey}!!!`);
    logger.info(`Selected Model: ${selectedModel}`);

    // context.OPENAI_API_KEY = apiKey;
  } catch (error) {
    logger.error(error);
  }
};

export default handleConfigureSubmit;
