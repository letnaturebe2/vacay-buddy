import {Team} from '../entity/team.model';
import {DataSource, Repository} from "typeorm";
import {User} from "../entity/user.model";
import {userService} from "./index";

export class TeamService {
  private teamRepository: Repository<Team>;

  constructor(dataSource: DataSource) {
    this.teamRepository = dataSource.getRepository(Team);
  }

  public async getOrCreateTeam(teamId: string): Promise<Team> {
    let team = await this.teamRepository.findOne({where: {teamId: teamId}});
    if (team === null) {
      team = await this.createTeam(teamId);
    }
    return team;
  }

  private async createTeam(teamId: string): Promise<Team> {
    const team = new Team();
    team.teamId = teamId;
    return await this.teamRepository.save(team);
  }

  public async getAdmins(team: Team): Promise<User[]> {
    return await userService.getAdmins(team);
  }

  public async updateAdmins(userIds: string[], team: Team) {
    await userService.updateAdmins(userIds, team);
  }
}