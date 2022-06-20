import { TransactionType } from '../faces/transaction';
import { Chunk } from '../faces/chunk';
import { Tag } from '../faces/arweave';
import { Next } from 'koa';
import Router from 'koa-router';
import bytes from 'bytes';
import {
  b64UrlToBuffer,
  bufferTob64Url,
  fromB64Url,
  sha256B64Url,
  sha256Hex,
  deepHash,
  stringToBuffer,
} from '../utils/encoding';
import { TransactionDB } from '../db/transaction';
import { computeRootHash } from '../utils/merkle';
import { concatBuffers } from '../utils/utils';
import { verifySignature } from '../utils/key';

const pathRegex = /^\/?([a-z0-9-_]{43})/i;
const txIDRegex = /[a-z0-9-_]{43}/i;
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

    // restrict tx in a bundle
    if ((metadata.bundledIn || '').length) {
      ctx.status = 404;
      ctx.body = 'Not Found';
      return;
    }

    await next();
  } catch (error) {
    console.error({ error });
  }
}

export async function txValidateMiddleware(ctx: Router.RouterContext, next: Next) {
  try {
    const { body = {} }: { body?: Partial<TransactionType> } = ctx.request;
    const requiredFields = ['format', 'id', 'last_tx', 'owner', 'reward', 'signature'];

    // closure so as to access
    // ctx (i.e &ctx)
    // not copy
    function badRequest() {
      ctx.status = 400;
      ctx.headers['content-type'] = 'text/html';
      ctx.body = 'Bad Request';
    }

    for (const field of requiredFields) {
      if (!body[field]) {
        // log error to console for debugging
        console.error({
          error: 'Validation Error',
          validationErrors: requiredFields.filter((f) => !body[f]).map((f) => `"${f}" is a required field`),
        });
        // return arweave.net type error to user
        badRequest();
        return;
      }
    }

    /**
     * manually check each field validation
     * based on docs.arweave.org
     */

    const validationErrors: string[] = [];

    // format validation
    if (![1, 2, '1', '2'].includes(body.format)) {
      validationErrors.push(`"format" should be one of [1, 2]`);
    }

    // id validation
    if (!txIDRegex.test(body.id)) {
      validationErrors.push(`"id" should match regex: /[a-z0-9-_]{43}/i`);
    }
    // validate id is sha256 hash of signature
    if (sha256B64Url(b64UrlToBuffer(body.signature) as Buffer) !== body.id) {
      validationErrors.push(`"id" is invalid, does not represent sha256 hash of transaction signature`);
    }

    // last_tx validation
    if (body.last_tx !== '') {
      let allowed = [''];
      // check if it's a valid block hash or last tx from wallet address
      const last50Blocks = await ctx.connection.select('id').from('blocks').orderBy('created_at', 'desc').limit(50);
      allowed = [...allowed, ...last50Blocks.map((blk) => blk.id)];
      // check if it's the last tx from the wallet address
      const [ownerLastTx = null] =
        (await ctx.connection
          .select('id')
          .from('transactions')
          .where('owner', body.owner)
          .orderBy('created_at', 'desc')
          .limit(1)) || [];
      if (ownerLastTx) {
        allowed.push(ownerLastTx.id);
      }

      if (!allowed.includes(body.last_tx)) {
        validationErrors.push(
          `"last_tx" is invalid, should be "", indep_hash one of last 50 blocks` +
            `or last transaction of owner address. It is always taken from the /tx_anchor endpoint.`,
        );
      }
    }

    // reward validation
    if (isNaN(parseInt(body.reward, 10))) {
      validationErrors.push(`"reward" is invalid, should be numeric string (in winstons)`);
    }

    // signature validation
    let $sign: Uint8Array;
    switch (parseInt(body.format as any, 10)) {
      case 1:
        const tags = body.tags.reduce((accumulator: Uint8Array, tag: Tag) => {
          return concatBuffers([accumulator, b64UrlToBuffer(tag.name), b64UrlToBuffer(tag.value)]);
        }, new Uint8Array());

        $sign = concatBuffers([
          b64UrlToBuffer(body.owner),
          b64UrlToBuffer(body.target),
          b64UrlToBuffer(body.data),
          stringToBuffer(body.quantity),
          stringToBuffer(body.reward),
          b64UrlToBuffer(body.last_tx),
          tags,
        ]);
        break;
      case 2:
        const tagList: [Uint8Array, Uint8Array][] = body.tags.map((tag: Tag) => [
          b64UrlToBuffer(tag.name),
          b64UrlToBuffer(tag.value),
        ]);

        $sign = await deepHash([
          stringToBuffer(body.format.toString()),
          b64UrlToBuffer(body.owner),
          b64UrlToBuffer(body.target),
          stringToBuffer(body.quantity),
          stringToBuffer(body.reward),
          b64UrlToBuffer(body.last_tx),
          tagList,
          stringToBuffer(body.data_size),
          b64UrlToBuffer(body.data_root),
        ]);
        break;
      default:
        validationErrors.push(`"format" should be one of [1, 2]`);
    }
    // verify public key signature with private key generated signature
    if ((await verifySignature(body.owner, $sign, b64UrlToBuffer(body.signature))) !== true) {
      validationErrors.push(`transaction "signature" is invalid`);
    }

    // tags validation
    if (!Array.isArray(body.tags)) {
      validationErrors.push(`"tags" should be an array`);
    } else {
      // verify all items in tags
      for (let i = 0; i < body.tags.length; i++) {
        if (!body.tags[i]?.name) {
          validationErrors.push(`"tags[${i}]" expected to have name, but found none`);
        }

        if (!body.tags[i]?.value) {
          validationErrors.push(`"tags[${i}]" expected to have value, but found none`);
        }
      }
    }

    // target validation
    if (body.target) {
      if (!txIDRegex.test(body.target)) {
        validationErrors.push(`"target" should match regex: /[a-z0-9-_]{43}/i`);
      }

      if (body.target === sha256B64Url(Buffer.from(body.owner))) {
        validationErrors.push(`"target" cannot be transaction owner address`);
      }
    }

    // quantity validation
    if (body.quantity && isNaN(parseInt(body.quantity, 10))) {
      validationErrors.push(`"quantity" is invalid, should be numeric string (in winstons)`);
    }

    // data_root validation
    if (body.data_root) {
      if (body.data_root !== '') {
        if (body.data && body.data !== '') {
          const genRoot = bufferTob64Url(await computeRootHash(b64UrlToBuffer(body.data)));
          if (genRoot !== body.data_root) {
            validationErrors.push(`"data_root" is invalid`);
          }
        }
      }

      if (body.data_root === '' && (body.data || '') !== '') {
        validationErrors.push(`"data_root" is invalid, cannot be empty string when "data" exists`);
      }
    }

    // data_size validation
    if (body.data_size) {
      if (isNaN(parseInt(body.data_size, 10))) {
        validationErrors.push(`"data_size" is invalid, should be size in bytes of transaction data`);
      }

      // verify data_size matches data or comb of all chunks
      if (body.data !== '') {
        if (fromB64Url(body.data).byteLength !== parseInt(body.data_size, 10)) {
          validationErrors.push(`"data_size" is invalid, should match transaction "data" size`);
        }
      } else {
        let chunks: Chunk[] =
          (await ctx.connection.select('*').from('chunks').where('data_root', body.data_root)) || [];

        if (chunks.length) {
          // filter duplicate data chunks
          const chunksHash = Array.from(new Set(chunks.map((c) => sha256Hex(c.chunk))));
          chunks = chunksHash.map((h) => chunks.find((c) => sha256Hex(c.chunk) === h));
          chunks.sort((a, b) => a.offset - b.offset);

          if (concatBuffers(chunks.map((c) => fromB64Url(c.chunk))).byteLength !== parseInt(body.data_size, 10)) {
            validationErrors.push(`"data_size" is invalid, should match transaction chunks combined size`);
          }
        }
      }
    }

    // data validation
    if (body.data) {
      if (!body.data_size || !body.data_root) {
        validationErrors.push(`"data_size" and "data_root" must be present to use "data" field`);
      }

      // verify data string doesn't pass 10/12 mb of data
      switch (parseInt(body.format as any, 10)) {
        case 1:
          if (fromB64Url(body.data).byteLength > bytes('10mb')) {
            validationErrors.push(`"data" is invalid, In v1 transactions, data cannot be bigger than 10 MiB`);
          }
          break;
        case 2:
          if (fromB64Url(body.data).byteLength > bytes('12mb')) {
            validationErrors.push(`"data" is invalid, In v2 transactions, data cannot be bigger than 10 MiB`);
          }
          break;
        default:
          validationErrors.push(`"format" should be one of [1, 2]`);
      }
    }

    if (validationErrors.length) {
      console.error({
        error: 'Validation Error',
        validationErrors,
      });

      badRequest();
      return;
    }

    await next();
  } catch (error) {
    console.error({ error });
  }
}
