import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const entitiesPath = join(__dirname, 'entity', '**', '*.{ts,js}');
const migrationsPath = join(__dirname, 'migration', '*.{ts,js}');

function getDataSourceConfig(): DataSourceOptions {
  const dbType = process.env.DB_TYPE || 'sqlite';

  const baseConfig: Partial<DataSourceOptions> = {
    entities: [entitiesPath],
    migrations: [migrationsPath],
    synchronize: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
    namingStrategy: new SnakeNamingStrategy(),
  };

  if (dbType === 'mysql') {
    return {
      ...baseConfig,
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    } as DataSourceOptions;
  }

  return {
    ...baseConfig,
    type: 'sqlite',
    database: 'database.sqlite',
  } as DataSourceOptions;
}

export const dataSource = new DataSource(getDataSourceConfig());
