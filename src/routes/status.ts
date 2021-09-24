import Router from 'koa-router';

export async function statusRoute(ctx: Router.RouterContext) {
  ctx.body = ctx.network;
}

export async function peersRoute(ctx: Router.RouterContext) {
  try {
    ctx.body = [ctx.request.header.host];
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}