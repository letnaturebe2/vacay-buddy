import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

function getDataSourceConfig(): DataSourceOptions {
  if (process.env.DB_TYPE === 'mysql') {
    return {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: ['src/entity/*.ts'],
      migrations: ['src/migration/*.ts'],
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.DB_LOGGING === 'true',
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  // Default to SQLite
  return {
    type: 'sqlite',
    database: 'database.sqlite',
    entities: ['src/entity/*.ts'],
    migrations: ['src/migration/*.ts'],
    synchronize: true,
    logging: true,
    namingStrategy: new SnakeNamingStrategy(),
  };
}

export const dataSource = new DataSource(getDataSourceConfig());
