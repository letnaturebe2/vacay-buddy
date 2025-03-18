import type { AllMiddlewareArgs, App } from '@slack/bolt';
import type { AppContext } from './app';
import { teamService, userService } from './service';

const loadAppContext = async ({ context, client, next }: AllMiddlewareArgs<AppContext>) => {
  if (!context.teamId || !context.userId) {
    return await next();
  }

  const result = await client.users.info({
    user: context.userId,
    include_locale: true,
  });

  context.locale = result.user?.locale ?? 'en-US';
  context.team = await teamService.getOrCreateTeam(context.teamId);
  context.user = await userService.getOrCreateUser(context.userId, context.team);

  if (context.user.name !== result.user?.real_name) {
    context.user.name = result.user?.real_name ?? '';
    await userService.updateUser(context.userId, {
      ...context.user,
      name: context.user.name,
    });
  }

  await next();
};

const registerMiddleware = (app: App) => {
  app.use(loadAppContext);
};

export default registerMiddleware;
