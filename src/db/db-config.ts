import { join } from 'node:path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const entitiesPath = join(__dirname, '..', 'entity', '**', '*.{ts,js}');
export const migrationsPath = join(__dirname, '..', 'migration', '*.{ts,js}');

export function getBaseDataSourceConfig() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  const commonConfig = {
    synchronize: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
    namingStrategy: new SnakeNamingStrategy(),
  };

  if (dbType === 'mysql') {
    return {
      ...commonConfig,
      type: 'mysql' as const,
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    };
  }

  return {
    ...commonConfig,
    type: 'sqlite' as const,
    database: 'database.sqlite',
  };
}
