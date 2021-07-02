import { Knex } from 'knex';
import { newDb } from 'pg-mem';
const db = newDb();

export const connect = (dbPath: string): Knex => {
  const knex = db.adapters.createKnex();
  return knex;
};
