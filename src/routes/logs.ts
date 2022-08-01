import { readFile } from 'fs/promises';
import Router from 'koa-router';

export async function logsRoute(ctx: Router.RouterContext) {
  try {
    ctx.body = await readFile('./logs', 'utf-8');
    return;
  } catch (error) {
    console.error({ error });
  }
}
