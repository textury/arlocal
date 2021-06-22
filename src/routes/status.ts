import Router from 'koa-router';

export async function statusRoute(ctx: Router.RouterContext) {
  ctx.body = ctx.network;
}
