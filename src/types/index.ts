import { User } from '../entity/user.model';
import { PtoRequest } from '../entity/pto-request.model';

export interface UserWithRequests {
  user: User;
  requests: PtoRequest[];
}
