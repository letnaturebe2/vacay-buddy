import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const testDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  entities: ["src/entity/*.ts"],
  synchronize: true,
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
});