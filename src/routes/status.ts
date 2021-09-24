import { RouterContext } from 'koa-router';

export async function statusRoute(ctx: RouterContext) {
  ctx.body = ctx.network;
}
