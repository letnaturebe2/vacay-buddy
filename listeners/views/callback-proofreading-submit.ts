import type {AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction} from '@slack/bolt';
import {OpenAI} from 'openai';
import type {GptContext} from '../../app';
import {ActionId} from '../../config/constants';
import {teamService} from '../../service/team.service';

const handleProofreadingSubmit = async (
  {
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

  await client.views.update({
    view_id: payload.id,
    view: {
      type: 'modal',
      callback_id: 'proofreading_results',
      title: {
        type: 'plain_text',
        text: 'Proofreading Results',
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
              text: `Processed with OpenAI's *${context.OPENAI_MODEL}* model:`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Test Proofreading Results*\n\nThis is a sample corrected text for testing purposes. Original text had several grammar and spelling errors that have been corrected.',
          },
        },
        {
          type: 'divider',
        },
      ],
    },
  });
};

export default handleProofreadingSubmit;
