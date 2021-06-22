import { BlockDB } from '../db/block';
import { Utils } from '../utils/utils';
import Router from 'koa-router';

let blockDB: BlockDB;

export async function mineRoute(ctx: Router.RouterContext) {
  if(!blockDB) {
    blockDB = new BlockDB(ctx.connection);
  }

  const inc = +(ctx.params?.qty || 1);
  
  ctx.network.current = await blockDB.mine(ctx.network.height, ctx.network.current, ctx.transactions);
  ctx.network.height = ctx.network.height + inc;
  ctx.network.blocks = ctx.network.blocks + inc;
  ctx.transactions = [];


  ctx.body = ctx.network;
}
