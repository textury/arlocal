import { BlockDB } from '../db/block';
import { Utils } from '../utils/utils';
import Router from 'koa-router';

let blockDB: BlockDB;

export async function blocksRoute(ctx: Router.RouterContext) {
  if (!blockDB) {
    blockDB = new BlockDB(ctx.connection);
  }

  const indepHash = ctx.params.indep_hash;
  const block = blockDB.getByIndepHash(indepHash);

  ctx.body = block;
}
