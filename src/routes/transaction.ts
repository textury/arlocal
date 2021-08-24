import Router from 'koa-router';
import { formatTransaction, TransactionDB } from '../db/transaction';
import { DataDB } from '../db/data';
import { Utils } from '../utils/utils';
import { TransactionType } from '../faces/transaction';
import { unbundleData } from 'ans104';

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

  let bundleFormat = '';
  let bundleVersion = '';

  for (const tag of data.tags) {
    const name = Utils.atob(tag.name);
    const value = Utils.atob(tag.value);

    if (name === 'Bundle-Format') bundleFormat = value;
    if (name === 'Bundle-Version') bundleVersion = value;
  }

  if (bundleFormat === 'binary' && bundleVersion === '2.0.0') {
    // ANS-104
    const bundle = unbundleData(Buffer.from(data.data, 'base64'));
    const items = bundle.getAll();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      await txPostRoute({
        ...ctx,
        connection: ctx.connection,
        logging: ctx.logging,
        network: ctx.network,
        transactions: ctx.transactions,
        request: {
          ...ctx.request,
          body: {
            id: bundle.getIdBy(i),
            ...item.toJSON(),
          },
        },
      });
    }
  }

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
