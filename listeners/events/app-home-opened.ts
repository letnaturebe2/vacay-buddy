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

  let message =
    'To enable this app in this Slack workspace, you need to save your OpenAI API key. ' +
    'Visit <https://platform.openai.com/account/api-keys|your developer page> to grap your key!';

  if (context.team !== null) {
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
