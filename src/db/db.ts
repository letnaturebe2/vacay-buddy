import { DataSource } from 'typeorm';
import { entitiesPath, getBaseDataSourceConfig } from './db-config';

export const dataSource = new DataSource({
  ...getBaseDataSourceConfig(),
  entities: [entitiesPath],
});
