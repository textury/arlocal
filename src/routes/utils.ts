import { up } from '../db/initialize';
import { readFile } from 'fs/promises';
import Router from 'koa-router';
import { Utils } from '../utils/utils';

export async function logsRoute(ctx: Router.RouterContext) {
  try {
    ctx.body = await readFile('./logs', 'utf-8');
    return;
  } catch (error) {
    console.error({ error });
  }
}

export async function resetRoute(ctx: Router.RouterContext) {
  try {
    ctx.network.blocks = 1;
    ctx.network.height = 0;
    ctx.network.current = Utils.randomID(64);
    await up(ctx.connection);
    ctx.body = 'reset done';
    return;
  } catch (error) {
    console.error({ error });
  }
}
