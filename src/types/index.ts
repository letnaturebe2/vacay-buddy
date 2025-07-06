import { PtoRequest } from '../entity/pto-request.model';
import { User } from '../entity/user.model';

export interface UserWithRequests {
  user: User;
  requests: PtoRequest[];
}
