import Router from 'koa-router';
import { TransactionDB } from '../db/transaction';
import { DataDB } from '../db/data';
import { Utils } from '../utils/utils';
import { b64UrlToBuffer } from '../utils/encoding';

export const dataRouteRegex = /^\/?([a-zA-Z0-9-_]{43})\/?$|^\/?([a-zA-Z0-9-_]{43})\/(.*)$/i;
export const pathRegex = /^\/?([a-z0-9-_]{43})/i;

let transactionDB: TransactionDB;
let dataDB: DataDB;
const decoder = new TextDecoder();

export async function dataHeadRoute(ctx: Router.RouterContext) {
  if (!dataDB) {
    dataDB = new DataDB(ctx.dbPath);
  }
  if (!transactionDB) {
    transactionDB = new TransactionDB(ctx.dbPath, ctx.connection);
  }

  const path = ctx.path.match(pathRegex) || [];
  const transaction = path.length > 1 ? path[1] : '';
  const metadata = await transactionDB.getById(transaction);

  ctx.logging.log(metadata);

  ctx.status = 200;
  ctx.headers['accept-ranges'] = 'bytes';
  ctx.headers['content-length'] = metadata.data_size;
}

export async function dataRoute(ctx: Router.RouterContext) {
  if (!dataDB) {
    dataDB = new DataDB(ctx.dbPath);
  }
  if (!transactionDB) {
    transactionDB = new TransactionDB(ctx.dbPath, ctx.connection);
  }

  const path = ctx.path.match(pathRegex) || [];
  const transaction = path.length > 1 ? path[1] : '';

  const metadata = await transactionDB.getById(transaction);
  ctx.logging.log(metadata);
  if (!metadata) {
    ctx.status = 404;
    ctx.body = { status: 404, error: 'Not Found' };
    return;
  }

  try {
    const contentType = Utils.tagValue(metadata.tags, 'Content-Type');
    ctx.type = contentType;
  } catch (e) {
    ctx.type = 'text/plain';
  }

  const data = await dataDB.findOne(transaction);

  console.log(data);

  ctx.body = decoder.decode(b64UrlToBuffer(data.data));
}
