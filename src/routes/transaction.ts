import Router from 'koa-router';
import { formatTransaction, transactionFields, TransactionDB } from '../db/transaction';
import { DataDB } from '../db/data';
import { Utils } from '../utils/utils';
import { TransactionType } from '../faces/transaction';

export const pathRegex = /^\/?([a-z0-9-_]{43})/i;

let transactionDB: TransactionDB;
let dataDB: DataDB;

export async function txAnchorRoute(ctx: Router.RouterContext) {
  const txs = await ctx.connection.select('id').from('transactions').limit(1);
  if (txs.length) {
    return (ctx.body = txs[0].id);
  }
  ctx.body = Utils.randomID();
}

export async function txRoute(ctx: Router.RouterContext) {
  if (!transactionDB) {
    transactionDB = new TransactionDB(ctx.dbPath, ctx.connection);
  }

  const path = ctx.params.txid.match(pathRegex) || [];
  const transaction = path.length > 1 ? path[1] : '';

  const metadata = await transactionDB.getById(transaction);
  ctx.logging.log(metadata);

  if (!metadata) {
    ctx.status = 404;
    ctx.body = { status: 404, error: 'Not Found' };
    return;
  }

  ctx.status = 200;
  ctx.headers['accept-ranges'] = 'bytes';
  ctx.headers['content-length'] = metadata.data_size;
  ctx.body = metadata;
}

export async function txPostRoute(ctx: Router.RouterContext) {
  if (!dataDB) {
    dataDB = new DataDB(ctx.dbPath);
  }

  const data = ctx.request.body as unknown as TransactionType;

  ctx.logging.log('post', data);

  await dataDB.insert({ txid: data.id, data: data.data });
  const tx = formatTransaction(data);

  tx.height = ctx.network.height;

  await ctx.connection.insert(tx).into('transactions');

  let index = 0;
  for (const tag of data.tags) {
    const name = Utils.atob(tag.name);
    const value = Utils.atob(tag.value);

    ctx.logging.log(name, value);

    await ctx.connection
      .insert({
        index,
        tx_id: tx.id,
        name,
        value,
      })
      .into('tags');

    index++;
  }

  ctx.transactions.push(data.id);

  ctx.body = data;
}

export async function txFieldRoute(ctx: Router.RouterContext) {
  if (!transactionDB) {
    transactionDB = new TransactionDB(ctx.dbPath, ctx.connection);
  }

  if (!transactionFields.includes(ctx.params.field)) {
    ctx.status = 400;
    ctx.body = { status: 400, error: 'Invalid hash' };
    return;
  }

  const path = ctx.params.txid.match(pathRegex) || [];
  const transaction = path.length > 1 ? path[1] : '';

  const metadata = await transactionDB.getById(transaction);

  if (!metadata) {
    ctx.status = 404;
    ctx.body = { status: 404, error: 'Not Found' };
    return;
  }

  ctx.body = metadata[ctx.params.field];
}
