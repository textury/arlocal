import Router from 'koa-router';
import { URL } from 'url';
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
    txid: string;
    data: string;
  };

  let metadata = await transactionDB.getById(transaction);
  ctx.logging.log(metadata);
  if (!metadata) {
    ctx.status = 404;
    ctx.body = { status: 404, error: 'Not Found' };
    return;
  }

  try {
    let contentType = Utils.tagValue(metadata.tags, 'Content-Type');

    const bundleFormat = Utils.tagValue(metadata.tags, 'Bundle-Format');
    const bundleVersion = Utils.tagValue(metadata.tags, 'Bundle-Version');
    if (bundleFormat === 'binary' && bundleVersion === '2.0.0') ctx.type = 'application/octet-stream';
    else if (contentType === 'application/x.arweave-manifest+json') {
      data = await dataDB.findOne(transaction);
      const manifestData = JSON.parse(decoder.decode(b64UrlToBuffer(data.data)));
      const indexPath = manifestData.index.path as string;

      // Also check for transaction subpath
      const subPath = getManifestSubpath(ctx.path);
      if (subPath) {
        if (!manifestData.paths[subPath]) {
          // Return 404
          ctx.status = 404;
          ctx.body = {
            status: 404,
            error: 'Data no found in manifest',
          };
          return;
        }

        transaction = manifestData.paths[subPath].id;
        metadata = await transactionDB.getById(transaction);

        if (!metadata) {
          ctx.status = 404;
          ctx.body = { status: 404, error: 'Tx not found' };
          return;
        }

        contentType = Utils.tagValue(metadata.tags, 'Content-Type');
      }

      if (!subPath) {
        if (indexPath) {
          transaction = manifestData.paths[indexPath].id;

          metadata = await transactionDB.getById(transaction);
          if (!metadata) {
            ctx.status = 404;
            ctx.body = { status: 404, error: 'Index TX not Found' };
            return;
          }

          contentType = Utils.tagValue(metadata.tags, 'Content-Type');
        }
      }

      ctx.type = contentType;
    } else ctx.type = contentType || 'text/plain';
  } catch (error) {
    console.error({ error });
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

export async function subDataRoute(ctx: Router.RouterContext, next: () => void) {
  try {
    // get the referrer url
    const { referer } = ctx.headers;
    // parse the url
    const url = new URL(referer);
    // Check if there was id before the data
    const txid = getTxIdFromPath(url.pathname);

    if (!txid) {
      next();
    }

    // Redirect
    ctx.redirect(`${referer}${ctx.path}`);
  } catch (error) {
    next();
  }
}

const getTxIdFromPath = (path: string): string | undefined => {
  const matches = path.match(/^\/?([a-z0-9-_]{43})/i) || [];
  return matches[1];
};

const getManifestSubpath = (requestPath: string): string | undefined => {
  return getTransactionSubpath(requestPath);
};

const getTransactionSubpath = (requestPath: string): string | undefined => {
  const subpath = requestPath.match(/^\/?[a-zA-Z0-9-_]{43}\/(.*)$/i);
  return (subpath && subpath[1]) || undefined;
};
