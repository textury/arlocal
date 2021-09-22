import Router from 'koa-router';
import { TransactionDB } from '../db/transaction';
import { DataDB } from '../db/data';
import { Utils } from '../utils/utils';
import { b64UrlToBuffer, bufferTob64 } from '../utils/encoding';
import { ChunkDB } from '../db/chunks';

export const dataRouteRegex = /^\/?([a-zA-Z0-9-_]{43})\/?$|^\/?([a-zA-Z0-9-_]{43})\/(.*)$/i;
export const pathRegex = /^\/?([a-z0-9-_]{43})/i;

let transactionDB: TransactionDB;
let dataDB: DataDB;
let chunkDB: ChunkDB;
let oldDbPath: string;
const decoder = new TextDecoder();

export async function dataHeadRoute(ctx: Router.RouterContext) {
  if (!dataDB) {
    dataDB = new DataDB(ctx.dbPath);
  }
  if (!transactionDB) {
    transactionDB = new TransactionDB(ctx.connection);
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
  if (oldDbPath !== ctx.dbPath || !dataDB || !transactionDB || !chunkDB) {
    dataDB = new DataDB(ctx.dbPath);
    transactionDB = new TransactionDB(ctx.connection);
    chunkDB = new ChunkDB(ctx.connection);
    oldDbPath = ctx.dbPath;
  }

  const path = ctx.path.match(pathRegex) || [];
  let transaction = path.length > 1 ? path[1] : '';
  let data: {
    txid: string,
    data: string,
  };

  const metadata = await transactionDB.getById(transaction);
  ctx.logging.log(metadata);
  if (!metadata) {
    ctx.status = 404;
    ctx.body = { status: 404, error: 'Not Found' };
    return;
  }

  try {
    const contentType = Utils.tagValue(metadata.tags, 'Content-Type');
    const bundleFormat = Utils.tagValue(metadata.tags, 'Bundle-Format');
    const bundleVersion = Utils.tagValue(metadata.tags, 'Bundle-Version');
    // if (bundleFormat === 'binary' && bundleVersion === '2.0.0') ctx.type = 'application/octet-stream';
    if (contentType === 'application/x.arweave-manifest+json')  {
      data = await dataDB.findOne(transaction);
      // Decode the data
      const bdy = JSON.parse(decoder.decode(b64UrlToBuffer(data.data)));
      console.log(bdy)
      // find the index path

      const indexPath = bdy.index.path as string;
      // get transaction id of index path
      const txid = bdy.paths[indexPath].id;
      transaction = txid;
    }
    else ctx.type = contentType || 'text/plain';
  } catch (e) {
    ctx.type = Utils.tagValue(metadata.tags, 'Content-Type') || 'text/plain';
  }

  data = await dataDB.findOne(transaction);

  ctx.logging.log(data);

  let body;
  if (!data?.data && !metadata.target) {
    const chunks = await chunkDB.getRoot(metadata.data_root);
    const chunk = chunks.map((ch) => Buffer.from(b64UrlToBuffer(ch.chunk)));

    body = Buffer.concat(chunk);
    dataDB.insert({ txid: metadata.id, data: bufferTob64(body) });
    ctx.body = body;
    return;
  } else body = data.data[0] === '[' ? data.data : Buffer.from(b64UrlToBuffer(data.data));

  ctx.body = body;
}
