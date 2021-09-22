import Router from 'koa-router';
import { TransactionDB } from '../db/transaction';
import { DataDB } from '../db/data';
import { TransactionType } from '../faces/transaction';
import { Utils } from '../utils/utils';

let transactionDB: TransactionDB;
let dataDB: DataDB;

export async function getTxManifest(ctx: Router.RouterContext) {
  try {
    const { txid } = ctx.params;
    
    if (!transactionDB) {
      transactionDB = new TransactionDB(ctx.connection);
    }

    if (!dataDB) {
      dataDB = new DataDB(ctx.dbPath);
    }

    if (!txid) {
      ctx.status = 400; // Bad request
      ctx.body = {
        status: 400,
        error: 'No transaction ID passed'
      };
      return;
    }
    // Check tx content type from tx db
    const metadata: TransactionType = await transactionDB.getById(txid);
    
    if (!metadata) {
      ctx.status = 404;
      ctx.body = { status: 404, error: 'Not Found' };
      return;
    }

    // check transaction tags
    let contentType: string;
    let bundleVersion: string;
    let bundleFormat: string;

    if ('tags' in metadata) {
      metadata.tags.forEach(({ name, value }) => {
        const n = Utils.atob(name);
        const v = Utils.atob(value); 

        if (n === 'Content-Type') {
          contentType = v;
        }

        if (n === 'Bundle-Version') {
          bundleVersion = v;
        }

        if (n === 'Bundle-Format') {
          bundleFormat = v;
        }
      })
    }
    // Check tx data from data db
    const data = await dataDB.findOne(txid);

    console.log(metadata);
    console.log(data);
    // Analyze content type
  } catch (error) {
    console.error({ error });
  }
}
