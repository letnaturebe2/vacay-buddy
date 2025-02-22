import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { GptContext } from '../../app';
import { ActionId } from '../../config/constants';

const appHomeOpenedCallback = async ({
  client,
  event,
  logger,
  context,
}: AllMiddlewareArgs<GptContext> & SlackEventMiddlewareArgs<'app_home_opened'>) => {
  if (event.tab !== 'home') {
    throw new Error('This event is not for the Home tab');
  }

  const hasTeam = context.team !== null;

  let message =
    'To enable this app in this Slack workspace, you need to save your OpenAI API key. ' +
    'Visit <https://platform.openai.com/account/api-keys|your developer page> to grap your key!';

  if (hasTeam) {
    message = 'Your OpenAI API key is already configured.';
  }

  const blocks: AnyBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Configuration* ',
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
      accessory: {
        action_id: ActionId.CONFIGURE,
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Configure',
        },
        style: 'primary',
        value: 'api_key',
      },
    },
  ];

  const chatTemplate = '*Chat Templates 😊*';
  const proofreading = 'Can you proofread the following sentence without changing its meaning?';
  const image_variations = 'Can you generate variations for my images?';
  const image_generation = 'Can you generate an image as I instruct you?';
  const from_scratch = '(Start a chat from scratch)';

  const chatTemplates: AnyBlock[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: chatTemplate },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: proofreading },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Start' },
        value: proofreading,
        action_id: ActionId.TEMPLATES_PROOFREAD,
      },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: image_generation },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Start' },
        value: image_generation,
        action_id: ActionId.TEMPLATES_IMAGE_GENERATION,
      },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: image_variations },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Start' },
        value: image_variations,
        action_id: ActionId.TEMPLATES_IMAGE_VARIATIONS,
      },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: from_scratch },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Start' },
        value: ' ',
        action_id: ActionId.TEMPLATES_FROM_SCRATCH,
      },
    },
  ];

  if (hasTeam) {
    blocks.push(...chatTemplates);
  }

  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.publish({
    user_id: event.user,
    view,
  });
};

export default appHomeOpenedCallback;
