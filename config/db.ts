import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const dataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  entities: ["entity/*.ts"],
  migrations: ["migration/*.ts"],
  synchronize: true,
  logging: true,
  namingStrategy: new SnakeNamingStrategy(),
});