import type {AllMiddlewareArgs, SlackEventMiddlewareArgs} from '@slack/bolt';
import {AnyBlock} from '@slack/types';

const appHomeOpenedCallback = async ({
                                         client,
                                         event,
                                         logger,
                                     }: AllMiddlewareArgs & SlackEventMiddlewareArgs<'app_home_opened'>) => {
    // Ignore the `app_home_opened` event for anything but the Home tab
    if (event.tab !== 'home') return;

    const message = "To enable this app in this Slack workspace, you need to save your OpenAI API key. " +
        "Visit <https://platform.openai.com/account/api-keys|your developer page> to grap your key!"

    const blocks: AnyBlock[] = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Configuration* `,
            },
        },
        {
            type: 'divider',
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: message || ' ',
            },
            accessory: {
                action_id: 'configure',
                type: 'button',
                text: {
                    type: 'plain_text',
                    text: 'Configure',
                },
                style: 'primary',
                value: 'api_key',
            },
        },
        // {
        //     type: 'section',
        //     text: {
        //         type: 'mrkdwn',
        //         text: `*Welcome home, <@${event.user}> :house:*`,
        //     },
        // },
    ];

    try {
        await client.views.publish({
            user_id: event.user,
            view: {
                type: 'home',
                blocks: blocks,
            },
        });
    } catch (error) {
        logger.error(error);
    }
};

export default appHomeOpenedCallback;



