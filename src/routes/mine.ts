import { BlockDB } from '../db/block';
import { Utils } from '../utils/utils';
import Router from 'koa-router';

const blockDB = new BlockDB();

export async function mineRoute(ctx: Router.RouterContext) {
  const inc = +(ctx.params?.qty || 1);

  // @ts-ignore
  ctx.network.current = await blockDB.mine(ctx.network.height, ctx.network.current, ctx.transactions);
  // @ts-ignore
  ctx.network.height = ctx.network.height + inc;
  // @ts-ignore
  ctx.network.blocks = ctx.network.blocks + inc;
  // @ts-ignore
  ctx.transactions = [];

  // @ts-ignore
  ctx.body = ctx.network;
}