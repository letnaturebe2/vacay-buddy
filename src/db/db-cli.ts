import { DataSource } from 'typeorm';
import { entitiesPath, getBaseDataSourceConfig, migrationsPath } from './db-config';

export const dataSource = new DataSource({
  ...getBaseDataSourceConfig(),
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: false,
});
