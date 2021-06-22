import { join } from 'path';
import { knex, Knex } from 'knex';

export const connect = (dbPath: string): Knex => {
  return knex({
    client: 'sqlite3',
    connection: {
      filename: join(dbPath, 'db.sqlite'),
    },
    useNullAsDefault: true,
  });
};
