import { join } from 'path';
import { knex, Knex } from 'knex';
import { dbPath } from '../index';

export const connection: Knex = knex({
  client: 'sqlite3',
  connection: {
    filename: join(`${dbPath}db.sqlite`),
  },
  useNullAsDefault: true,
});
