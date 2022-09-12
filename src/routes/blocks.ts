import { BlockDB } from '../db/block';
import Router from 'koa-router';

let blockDB: BlockDB;

export async function blocksRoute(ctx: Router.RouterContext) {
  try {
    if (!blockDB) {
      blockDB = new BlockDB(ctx.connection);
    }

    const indepHash = ctx.params.indep_hash;
    const { id, mined_at: timestamp, previous_block, txs, height } = await blockDB.getByIndepHash(indepHash);

    ctx.body = {
      indep_hash: id,
      timestamp: Math.round(new Date(timestamp).getTime() / 1000),
      previous_block,
      // return block height instead of current height
      height,
      txs: txs ? txs.split(',') : [],
    };
  } catch (error) {
    console.error({ error });
  }
}

export async function blocksRouteViaHeight(ctx: Router.RouterContext) {
  try {
    if (!blockDB) {
      blockDB = new BlockDB(ctx.connection);
    }

    const h = parseInt(ctx.params.height, 10) || 0;
    const block = await blockDB.getByHeight(h);
    const { id, mined_at: timestamp, previous_block, txs, height } = block;

    ctx.body = {
      indep_hash: id,
      timestamp: Math.round(new Date(timestamp).getTime() / 1000),
      previous_block,
      height,
      txs: txs ? txs.split(',') : [],
    };
  } catch (error) {
    console.error({ error });
  }
}
