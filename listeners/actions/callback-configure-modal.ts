import type {AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs} from '@slack/bolt';
import type {ModalView} from '@slack/types';
import type {GptContext} from '../../app';
import {ActionId} from '../../config/constants';
import translate from '../../openai_ops';

const buildConfigureModal = async (context: GptContext): Promise<ModalView> => {
  const alreadySetApiKey = context.OPENAI_API_KEY;
  let apiKeyText = 'Save your OpenAI API key:';
  let submit = 'Submit';
  let cancel = 'Cancel';

  if (alreadySetApiKey !== undefined) {
    apiKeyText = await translate(alreadySetApiKey, context, apiKeyText);
    submit = await translate(alreadySetApiKey, context, submit);
    cancel = await translate(alreadySetApiKey, context, cancel);
  }

  const options = [
    {text: {type: 'plain_text' as const, text: 'GPT-3.5 Turbo'}, value: 'gpt_3_5_turbo'},
    {text: {type: 'plain_text' as const, text: 'GPT-4 8K'}, value: 'gpt_4'},
    {text: {type: 'plain_text' as const, text: 'GPT-4 32K'}, value: 'gpt_4_32k'},
    {text: {type: 'plain_text' as const, text: 'GPT-4o'}, value: 'gpt_4o'},
    {text: {type: 'plain_text' as const, text: 'GPT-4o-mini'}, value: 'gpt_4o_mini'},
  ];

  const defaultOption = options.find(
    (option) => option.value === context.team?.model);
  return {
    type: 'modal',
    callback_id: ActionId.CONFIGURE,
    title: {type: 'plain_text', text: 'OpenAI API Key'},
    submit: {type: 'plain_text', text: submit},
    close: {type: 'plain_text', text: cancel},
    blocks: [
      {
        type: 'input',
        block_id: 'api_key',
        label: {type: 'plain_text', text: apiKeyText || ' '},
        element: {
          initial_value: alreadySetApiKey,
          type: 'plain_text_input',
          action_id: 'input',
          placeholder: {type: 'plain_text', text: 'Paste your API key starting with sk-...'},
        },
      },
      {
        type: 'input',
        block_id: 'model',
        label: {type: 'plain_text', text: 'OpenAI Model'},
        element: {
          type: 'static_select',
          action_id: 'input',
          options: options,
          initial_option: defaultOption,
        },
      },
    ],
  };
};

/**
 * Callback function for the 'configure' action.
 * This function is called from the home tab.
 */
const callbackConfigureModal = async (
  {
    ack,
    client,
    body,
    logger,
    context,
  }: AllMiddlewareArgs<GptContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  try {
    await ack();
    await client.views.open({
      trigger_id: body.trigger_id,
      view: await buildConfigureModal(context),
    });
  } catch (error) {
    logger.error(error);
  }
};

export default callbackConfigureModal;
