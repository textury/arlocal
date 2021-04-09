import {knex, Knex} from "knex";

export const connection: Knex = knex({
  client: 'sqlite3',
  connection: {
    filename: './db/db.sqlite'
  }, 
  useNullAsDefault: true
});