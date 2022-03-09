import { TransactionType } from 'faces/transaction';
import { Next } from 'koa';
import Router from 'koa-router';
import { TransactionDB } from '../db/transaction';
import { Utils } from '../utils/utils';

const pathRegex = /^\/?([a-z0-9-_]{43})/i;
let transactionDB: TransactionDB;
let oldDbPath: string;
let connectionSettings: string;

export async function txAccessMiddleware(ctx: Router.RouterContext, next: Next) {
  try {
    if (
      oldDbPath !== ctx.dbPath ||
      !transactionDB ||
      connectionSettings !== ctx.connection.client.connectionSettings.filename
    ) {
      transactionDB = new TransactionDB(ctx.connection);
      oldDbPath = ctx.dbPath;
      connectionSettings = ctx.connection.client.connectionSettings.filename;
    }

    const rough = ctx.request.url.split('/tx')[1];
    const path = rough.match(pathRegex) || [];
    const txid = path.length > 1 ? path[1] : '';

    const metadata: TransactionType = await transactionDB.getById(txid);
    ctx.logging.log(metadata);

    if (!metadata) {
      ctx.status = 404;
      ctx.body = 'Not Found';
      return;
    }

    let bundleFormat = '';
    let bundleVersion = '';

    bundleFormat = Utils.tagValue(metadata.tags, 'Bundle-Format');
    bundleVersion = Utils.tagValue(metadata.tags, 'Bundle-Version');

    if (bundleFormat === 'binary' && bundleVersion === '2.0.0') {
      // return not found
      ctx.status = 404;
      ctx.body = 'Not Found';
      return;
    }

    await next();
  } catch (error) {
    console.error({ error });
  }
}
