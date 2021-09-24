import { RouterContext } from 'koa-router';

export async function peersRoute(ctx: RouterContext) {
  try {
    ctx.body = [ctx.request.header.host];
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}
