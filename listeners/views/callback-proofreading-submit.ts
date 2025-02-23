import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import { OpenAI } from 'openai';
import type { GptContext } from '../../app';
import { ActionId } from '../../config/constants';
import { teamService } from '../../service/team.service';

const handleProofreadingSubmit = async ({
  ack,
  body,
  view,
  context,
  logger,
  client,
  payload,
}: AllMiddlewareArgs<GptContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      callback_id: body.view.callback_id,
      title: {
        type: 'plain_text',
        text: 'Proofreading',
      },
      close: {
        type: 'plain_text',
        text: 'Close',
      },
      private_metadata: payload.private_metadata,
      blocks: [
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Running OpenAI's *${context.OPENAI_MODEL}* model:`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Proofreading your input now ... :hourglass:',
          },
        },
      ],
    },
  });
};

export default handleProofreadingSubmit;
