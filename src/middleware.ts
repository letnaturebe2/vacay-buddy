import type { AllMiddlewareArgs, App } from '@slack/bolt';
import type { AppContext } from './app';
import type { Organization } from './entity/organization.model';
import { organizationService, userService } from './service';
import { assert } from './utils';

type EventWithUser = {
  user_id?: string;
};

export type ExtendedSlackMiddlewareArgs = AllMiddlewareArgs<AppContext> & {
  event?: EventWithUser;
};

const loadAppContext = async ({ context, client, next, event }: ExtendedSlackMiddlewareArgs) => {
  const organizationId = context.teamId || context.enterpriseId;
  const userId = context.userId || event?.user_id;

  assert(organizationId !== undefined, 'Organization ID is undefined');

  if (!organizationId || !userId) {
    return await next();
  }

  const organization: Organization = await organizationService.getOrCreateOrganization(
    organizationId,
    context.enterpriseId !== undefined,
  );

  const result = await client.users.info({
    user: userId,
    include_locale: true,
  });

  const slackUser = result.user;

  context.locale = slackUser?.locale ?? 'ko-KR';
  context.organization = organization;
  context.user = await userService.getOrCreateUser(userId, context.organization);

  if (context.user.name !== slackUser?.real_name) {
    context.user.name = slackUser?.real_name ?? '';
    await userService.updateUser(userId, {
      ...context.user,
      name: context.user.name,
      tz: slackUser?.tz ?? 'Asia/Seoul',
      tz_offset: slackUser?.tz_offset ?? 32400,
    });
  }

  await next();
};

const registerMiddleware = (app: App) => {
  // biome-ignore lint/suspicious/noExplicitAny: Slack Bolt's type system limitation requires type assertion for middleware with extended event types
  app.use(loadAppContext as any);
};

export default registerMiddleware;
