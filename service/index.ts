import { TeamService } from "./team.service";
import { UserService } from "./user.service";
import { dataSource } from "../config/db";

export const userService = new UserService(dataSource);
export const teamService = new TeamService(dataSource);