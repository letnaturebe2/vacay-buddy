import type { AllMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../app';
import { PtoRequest } from '../entity/pto-request.model';
import { User } from '../entity/user.model';

export interface UserWithRequests {
  user: User;
  requests: PtoRequest[];
}

export type ExtendedSlackMiddlewareArgs = AllMiddlewareArgs<AppContext> & {
  event?: {
    user_id?: string;
  };
};
