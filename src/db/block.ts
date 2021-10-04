import { Knex } from 'knex';
import { Utils } from '../utils/utils';

export class BlockDB {
  private connection: Knex;

  constructor(connection: Knex) {
    this.connection = connection;
  }

  async getOne() {
    return this.connection.select('*').from('blocks');
  }

  async getByIndepHash(indepHash: string) {
    return (await this.connection.queryBuilder().select('*').from('blocks').where('id', '=', indepHash).limit(1))[0];
  }

  async mine(height: number, previous: string, txs: string[]) {
    try {
      const id = Utils.randomID(64);

      await this.connection
        .insert({
          id,
          height,
          mined_at: Date.now(),
          previous_block: previous,
          txs,
          extended: '',
        })
        .into('blocks');

      return id;
    } catch (error) {
      console.error({ error });
    }
  }
}
