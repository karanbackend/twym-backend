import { DataSourceOptions } from 'typeorm';
import * as path from 'path';
import { AppConfig } from './app.config';
import type { DatabaseConfig } from './env.config';

export function createTypeOrmOptions(appConfig: AppConfig): DataSourceOptions {
    const db: Partial<DatabaseConfig> = appConfig.database ?? {};

    const useUrl = !!db.url;

    const base: Partial<DataSourceOptions> = useUrl
        ? ({
              type: (db.type as DataSourceOptions['type']) ?? 'postgres',
              url: db.url ?? undefined,
          } as unknown as Partial<DataSourceOptions>)
        : ({
              type: (db.type as DataSourceOptions['type']) ?? 'postgres',
              host: db.host ?? 'localhost',
              port: db.port ?? 5432,
              username: db.username ?? 'postgres',
              password: db.password ?? 'postgres',
              database: db.database ?? 'twym',
          } as unknown as Partial<DataSourceOptions>);

    const ssl = db.ssl === true;

    const entitiesGlob = [path.join(__dirname, '..', '..', '**', '*.entity.{ts,js}')];

    return {
        ...base,
        entities: entitiesGlob,
        synchronize: !!db.synchronize,
        logging: false,
        extra: ssl ? { ssl: { rejectUnauthorized: false } } : undefined,
    } as DataSourceOptions;
}
