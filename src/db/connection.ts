import { join } from 'path';
import { knex, Knex } from 'knex';

export const connection: Knex = knex({
  client: 'sqlite3',
  connection: {
    filename: join('db', 'db.sqlite'),
  },
  useNullAsDefault: true,
});
