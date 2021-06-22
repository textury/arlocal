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

  async mine(height: number, previous: string, txs: string[]) {
    const id = Utils.randomID(64);

    await this.connection
      .insert({
        id,
        height,
        mined_at: this.connection.fn.now(),
        previous_block: previous,
        txs,
        extended: '',
      })
      .into('blocks');

    return id;
  }
}
