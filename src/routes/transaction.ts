import Router from 'koa-router';
import { formatTransaction, TransactionDB } from '../db/transaction';
import { DataDB } from '../db/data';
import { connection } from '../db/connection';
import { Utils } from '../utils/utils';
import { b64UrlDecode } from '../utils/encoding';

export const pathRegex = /^\/?([a-z0-9-_]{43})/i;

const transactionDB = new TransactionDB();
const dataDB = new DataDB();

export async function txAnchorRoute(ctx: Router.RouterContext) {
  const txs = await connection.select('id').from('transactions').limit(1);
  if (txs.length) {
    return (ctx.body = txs[0].id);
  }
  ctx.body = Utils.randomID();
}

export async function txRoute(ctx: Router.RouterContext) {
  const path = ctx.params.txid.match(pathRegex) || [];
  const transaction = path.length > 1 ? path[1] : '';
  const metadata = await transactionDB.getById(transaction);

  console.log(metadata);
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
  const data = ctx.request.body;

  console.log('post', data);

  await dataDB.insert({ txid: data.id, data: data.data });
  const tx = formatTransaction(data);

  // @ts-ignore
  tx.height = ctx.network.height;

  await connection.insert(tx).into('transactions');

  let index = 0;
  for (const tag of data.tags) {
    const name = Utils.atob(tag.name);
    const value = Utils.atob(tag.value);

    console.log(name, value);

    await connection
      .insert({
        // @ts-ignore
        index,
        tx_id: tx.id,
        name,
        value,
      })
      .into('tags');

    index++;
  }

  // @ts-ignore
  ctx.transactions.push(data.id);

  ctx.body = data;
}
