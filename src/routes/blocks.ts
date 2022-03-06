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
      timestamp: new Date(timestamp).getTime(),
      previous_block,
      // return block height instead of current height
      height,
      txs: txs.split(','),
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
    if (h === 0 && !block) {
      // return genesis block
      // hash = genesis block hash
      let hash = ctx.network.current;
      if (ctx.network.height > 0) {
        // find the previous block of the height 1 block
        const blk = await blockDB.getByHeight(1);
        ({ previous_block: hash } = blk);
      }

      ctx.body = {
        indep_hash: hash,
        timestamp: ctx.timestamp,
        previous_block: '',
        height: h,
        txs: [""]
      };
      return;
    }

    const { id, mined_at: timestamp, previous_block, txs, height } = block;
    ctx.body = {
      indep_hash: id,
      timestamp: new Date(timestamp).getTime(),
      previous_block,
      height,
      txs: txs.split(','),
    };
  } catch (error) {
    console.error({ error });
  }
}
