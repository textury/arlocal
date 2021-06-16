import Router from 'koa-router';
import { TransactionDB } from '../db/transaction';
import { DataDB } from '../db/data';
import { Utils } from '../utils/utils';
import { b64UrlToBuffer } from '../utils/encoding';

export const dataRouteRegex = /^\/?([a-zA-Z0-9-_]{43})\/?$|^\/?([a-zA-Z0-9-_]{43})\/(.*)$/i;
export const pathRegex = /^\/?([a-z0-9-_]{43})/i;

const transactionDB = new TransactionDB();
const decoder = new TextDecoder();

export async function dataHeadRoute(ctx: Router.RouterContext) {
  const path = ctx.path.match(pathRegex) || [];
  const transaction = path.length > 1 ? path[1] : '';
  const metadata = await transactionDB.getById(transaction);

  console.log(metadata);

  ctx.status = 200;
  ctx.headers['accept-ranges'] = 'bytes';
  ctx.headers['content-length'] = metadata['data_size'];
}

export async function dataRoute(ctx: Router.RouterContext) {
  const path = ctx.path.match(pathRegex) || [];
  const transaction = path.length > 1 ? path[1] : '';

  const metadata = await transactionDB.getById(transaction);

  const contentType = Utils.tagValue(metadata['tags'], 'Content-Type');

  ctx.type = contentType;

  const db = new DataDB();
  const data = await db.findOne(transaction);
  ctx.body = decoder.decode(b64UrlToBuffer(data.data));
}
