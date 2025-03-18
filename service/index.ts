import { TeamService } from "./team.service";
import { UserService } from "./user.service";
import { dataSource } from "../config/db";
import {PtoService} from "./pto.service";

export const userService = new UserService(dataSource);
export const teamService = new TeamService(dataSource, userService);
export const ptoService = new PtoService(dataSource, userService);