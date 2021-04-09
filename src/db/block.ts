import {knex} from "knex";
import { Utils } from "../utils/utils";
import { connection } from "./connection";

export class BlockDB {
  async getOne() {
    return connection.select('*').from('blocks');
  }

  async mine(height: number, previous: string, txs: string[]) {
    const id = Utils.randomID(64);

    await connection.insert({
      id,
      height,
      mined_at: connection.fn.now(),
      previous_block: previous,
      txs,
      extended: ''
    }).into('blocks');

    return id;
  }
}