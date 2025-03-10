import type {AllMiddlewareArgs, App} from '@slack/bolt';
import {teamService} from "./service/team.service";
import {AppContext} from "./app";
import {userService} from "./service/user.service";

const setLocale = async ({context, client, next}: AllMiddlewareArgs<AppContext>) => {
  if (!context.userId) {
    return await next();
  }

  const result = await client.users.info({
    user: context.userId,
    include_locale: true,
  });

  context.locale = result.user?.locale ?? 'en-US';

  await next();
};

const setUserProfile = async ({context, next}: AllMiddlewareArgs<AppContext>) => {
  if (!context.teamId || !context.userId) {
    return await next();
  }

  context.team = await teamService.getOrCreateTeam(context.teamId);
  context.user = await userService.getOrCreateUser(context.userId, context.team);

  await next();
};

const registerMiddleware = (app: App) => {
  app.use(setLocale);
  app.use(setUserProfile);
};

export default registerMiddleware;
