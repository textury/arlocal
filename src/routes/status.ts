import Router from 'koa-router';

export async function statusRoute(ctx: Router.RouterContext) {
  // @ts-ignore
  ctx.body = ctx.network;
}
