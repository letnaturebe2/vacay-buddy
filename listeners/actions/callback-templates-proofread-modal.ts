import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { ButtonAction } from '@slack/bolt/dist/types/actions/block-action';
import type { ModalView } from '@slack/types';
import type { GptContext } from '../../app';
import { ActionId } from '../../config/constants';

const buildTemplateProofreadModal = async (context: GptContext, buttonAction: ButtonAction): Promise<ModalView> => {
  if (buttonAction.value === undefined) {
    throw new Error('Prompt is undefined');
  }

  const tone_and_voice_options = [
    {
      text: { type: 'plain_text' as const, text: 'Friendly and humble individual in Slack' },
      value: 'Friendly and humble individual in Slack',
    },
    {
      text: { type: 'plain_text' as const, text: 'Software developer discussing issues on GitHub' },
      value: 'Software developer discussing issues on GitHub',
    },
    {
      text: { type: 'plain_text' as const, text: 'Engaging yet insightful social media poster' },
      value: 'Engaging yet insightful social media poster',
    },
    {
      text: { type: 'plain_text' as const, text: 'Customer service representative handling inquiries' },
      value: 'Customer service representative handling inquiries',
    },
    {
      text: { type: 'plain_text' as const, text: 'Marketing manager creating a product launch script' },
      value: 'Marketing manager creating a product launch script',
    },
    {
      text: { type: 'plain_text' as const, text: 'Technical writer documenting software procedures' },
      value: 'Technical writer documenting software procedures',
    },
    {
      text: { type: 'plain_text' as const, text: 'Product manager creating a roadmap' },
      value: 'Product manager creating a roadmap',
    },
    {
      text: { type: 'plain_text' as const, text: 'HR manager composing a job description' },
      value: 'HR manager composing a job description',
    },
    {
      text: { type: 'plain_text' as const, text: 'Public relations officer drafting statements' },
      value: 'Public relations officer drafting statements',
    },
    {
      text: { type: 'plain_text' as const, text: 'Scientific researcher publicizing findings' },
      value: 'Scientific researcher publicizing findings',
    },
    {
      text: { type: 'plain_text' as const, text: 'Travel blogger sharing experiences' },
      value: 'Travel blogger sharing experiences',
    },
    {
      text: { type: 'plain_text' as const, text: 'Speechwriter crafting a persuasive speech' },
      value: 'Speechwriter crafting a persuasive speech',
    },
  ];

  return {
    type: 'modal',
    callback_id: ActionId.PROOFREAD,
    title: { type: 'plain_text', text: 'Proofreading' },
    submit: { type: 'plain_text', text: 'Submit' },
    close: { type: 'plain_text', text: 'Close' },
    private_metadata: JSON.stringify({ prompt: buttonAction.value }),
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: buttonAction.value },
      },
      {
        type: 'input',
        block_id: 'original_text',
        label: { type: 'plain_text', text: 'Your Text' },
        element: {
          type: 'plain_text_input',
          action_id: 'input',
          multiline: true,
        },
      },
      {
        type: 'input',
        block_id: 'tone_and_voice',
        label: { type: 'plain_text', text: 'Tone and voice' },
        element: {
          type: 'static_select',
          action_id: 'input',
          options: tone_and_voice_options,
        },
        optional: false,
      },
    ],
  };
};

const callbackTemplateProofreadModal = async ({
  ack,
  client,
  body,
  logger,
  context,
  payload,
}: AllMiddlewareArgs<GptContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  if (payload.type !== 'button') {
    throw new Error('Invalid action type');
  }

  await client.views.open({
    trigger_id: body.trigger_id,
    view: await buildTemplateProofreadModal(context, payload),
  });
};

export default callbackTemplateProofreadModal;
