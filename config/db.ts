import "reflect-metadata";
import { DataSource } from "typeorm";

export const dataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  entities: ["entity/*.ts"],
  migrations: ["migration/*.ts"],
  synchronize: true,
  logging: true,
});