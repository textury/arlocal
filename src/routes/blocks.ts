import { BlockDB } from '../db/block';
import { Utils } from '../utils/utils';
import Router from 'koa-router';

let blockDB: BlockDB;

export async function blocksRoute(ctx: Router.RouterContext) {
  try {
    if (!blockDB) {
      blockDB = new BlockDB(ctx.connection);
    }

    const indepHash = ctx.params.indep_hash;
    const { id, mined_at: timestamp, previous_block, txs } = await blockDB.getByIndepHash(indepHash);

    ctx.body = {
      indep_hash: id,
      timestamp: new Date(timestamp).getTime(),
      previous_block,
      height: ctx.network.height,
      txs: txs.split(','),
    };
  } catch (error) {
    console.error({ error });
  }
}
