import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { GptContext } from '../../app';
import { teamService } from '../../service/team.service';

const handleConfigureSubmit = async ({
  ack,
  body,
  view,
  context,
  logger,
}: AllMiddlewareArgs<GptContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  await ack();

  const values = view.state.values;
  const apiKey = values.api_key?.input?.value;
  const selectedModel = values.model?.input?.selected_option?.value;

  if (!context.teamId || !apiKey) {
    throw new Error('teamId or apiKey is missing');
  }

  const team = await teamService.upsertTeam(context.teamId, apiKey);
  logger.info(`Saved API Key: ${apiKey}!!!`);
  logger.info(`Selected Model: ${selectedModel}`);

  // context.OPENAI_API_KEY = apiKey;
};

export default handleConfigureSubmit;
