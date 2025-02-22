import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import { OpenAI } from 'openai';
import type { GptContext } from '../../app';
import { teamService } from '../../service/team.service';

const handleConfigureSubmit = async ({
  ack,
  body,
  view,
  context,
  logger,
}: AllMiddlewareArgs<GptContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  const values = view.state.values;
  const apiKey = values.api_key?.input?.value as string;
  const selectedModel = values.model?.input?.selected_option?.value as string;

  if (!context.teamId || !apiKey) {
    throw new Error('teamId or apiKey is missing');
  }

  try {
    const openai = new OpenAI({ apiKey });
    await openai.models.list();
    logger.info('API Key is valid.');
  } catch (error) {
    await ack({
      response_action: 'errors',
      errors: {
        api_key: 'This API key seems to be invalid. Please try again.',
      },
    });
  }

  await teamService.upsertTeam(context.teamId, apiKey, selectedModel);
  logger.info(`Saved API Key: ${apiKey}!`);
  logger.info(`Selected Model: ${selectedModel}!`);
  await ack();
};

export default handleConfigureSubmit;
