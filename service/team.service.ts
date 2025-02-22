import {Team} from '../entity/team';
import {dataSource} from "../config/db";
import {Repository} from "typeorm";

export class TeamService {
  private teamRepository: Repository<Team>;

  constructor() {
    this.teamRepository = dataSource.getRepository(Team);
  }

  public async getTeam(teamId: string): Promise<Team | null> {
    return await this.teamRepository.findOne({where: {team_id: teamId}});
  }

  private async createTeam(teamId: string, apiKey: string, model: string): Promise<Team> {
    const team = new Team();
    team.team_id = teamId;
    team.api_key = apiKey;
    team.model = model;
    return await this.teamRepository.save(team);
  }

  private async updateTeam(teamId: string, apiKey: string, model: string): Promise<Team> {
    const team = await this.getTeam(teamId);

    if (!team) {
      return await this.createTeam(teamId, apiKey, model);
    }

    team.api_key = apiKey;
    team.model = model;
    return await this.teamRepository.save(team);
  }

  public async upsertTeam(teamId: string, apiKey: string, model: string): Promise<Team> {
    const team = await this.getTeam(teamId);
    if (!team) {
      return await this.createTeam(teamId, apiKey, model);
    }
    return await this.updateTeam(teamId, apiKey, model);
  }
}

export const teamService = new TeamService();