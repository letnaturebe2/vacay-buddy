import {Team} from '../entity/team.model';
import {DataSource, Repository} from "typeorm";
import {User} from "../entity/user.model";
import {UserService} from "./user.service";

export class TeamService {
  private readonly teamRepository: Repository<Team>;
  private readonly userService: UserService;

  constructor(dataSource: DataSource, userService: UserService) {
    this.teamRepository = dataSource.getRepository(Team);
    this.userService = userService;
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
    return await this.userService.getAdmins(team);
  }

  public async updateAdmins(userIds: string[], team: Team) {
    await this.userService.updateAdmins(userIds, team);
  }
}