import { BlockDB } from '../db/block';
import Router from 'koa-router';
import { formatTransaction, TransactionDB } from '../db/transaction';
import { Tag } from '../faces/arweave';
import { Utils } from '../utils/utils';
import { ChunkDB } from '../db/chunks';
import { DataDB } from '../db/data';
import { Chunk } from '../faces/chunk';
import { b64UrlToBuffer, sha256Hex } from '../utils/encoding';
import { Bundle } from 'arbundles';
import { TransactionType } from '../faces/transaction';

let blockDB: BlockDB;
let chunkDB: ChunkDB;
let dataDB: DataDB;
let transactionDB: TransactionDB;
let connectionSettings: string;

export async function mineRoute(ctx: Router.RouterContext) {
  try {
    if (
      !blockDB ||
      !chunkDB ||
      !dataDB ||
      connectionSettings !== ctx.connection.client.connectionSettings.filename ||
      !transactionDB
    ) {
      blockDB = new BlockDB(ctx.connection);
      chunkDB = new ChunkDB(ctx.connection);
      dataDB = new DataDB(ctx.dbPath);
      transactionDB = new TransactionDB(ctx.connection);
      connectionSettings = ctx.connection.client.connectionSettings.filename;
    }

    let txs = await transactionDB.getUnminedTxsRaw();
    const unverifiedBundleTxs: string[] = [];

    // unbundle ans-104 bundles that were posted via /chunks
    for (const tx of txs) {
      if (tx.data) continue;

      // implementation of unbundling similar to line 153 of routes/transaction.ts
      // but directly to database
      const createTxsFromItems = async (buffer: Buffer): Promise<boolean> => {
        const bundle = new Bundle(buffer);

        const verified = await bundle.verify();
        if (!verified) return false;
        const items = bundle.items;

        // verify if bundles haven't been unbundled already
        const ids = items.map((_, i) => bundle.getIdBy(i));
        const matches = (await ctx.connection('transactions').whereIn('id', ids).select('id')).map((i) => i.id) || [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const id = bundle.getIdBy(i);
          if (matches.includes(id)) continue;

          // build tx body
          const $tx = {
            id,
            bundledIn: tx.id,
            ...item.toJSON(),
          };

          // insert transaction
          const toPost = formatTransaction($tx as TransactionType);
          toPost.created_at = tx.created_at;
          toPost.height = tx.height;
          await ctx.connection.insert(toPost).into('transactions');
          // insert data
          await dataDB.insert({ txid: id, data: $tx.data });
          // insert tags
          let index = 0;
          for (const tag of $tx.tags) {
            const name = Utils.atob(tag.name);
            const value = Utils.atob(tag.value);

            ctx.logging.log(name, value);

            await ctx.connection
              .insert({
                index,
                tx_id: id,
                name,
                value,
              })
              .into('tags');

            index++;
          }
        }
        return true;
      };

      let tags: Tag[] = [];
      try {
        tags = JSON.parse(tx.tags);
      } catch {}

      let bundleFormat: string = '';
      let bundleVersion: string = '';
      for (const tag of tags) {
        const name = Utils.atob(tag.name);
        const value = Utils.atob(tag.value);
        if (name === 'Bundle-Version') bundleVersion = value;
        if (name === 'Bundle-Format') bundleFormat = value;
      }

      if (bundleFormat === 'binary' && bundleVersion === '2.0.0') {
        let chunks: Chunk[] = (await chunkDB.getRoot(tx.data_root)) || [];
        if (chunks.length) {
          // filter duplicate data chunks
          const chunksHash = Array.from(new Set(chunks.map((c) => sha256Hex(c.chunk))));
          chunks = chunksHash.map((h) => chunks.find((c) => sha256Hex(c.chunk) === h));
          chunks.sort((a, b) => a.offset - b.offset);
          // parse chunk(s) to buffer
          const chunk = chunks.map((ch) => Buffer.from(b64UrlToBuffer(ch.chunk)));
          const buffer = Buffer.concat(chunk);
          const done = await createTxsFromItems(buffer);
          if (!done) unverifiedBundleTxs.push(tx.id);
        }
      }
    }

    const inc = +(ctx.params?.qty || 1);

    txs = await transactionDB.getUnminedTxs();
    for (let i = 1; i <= inc; i++) {
      let $txs = [];
      if (i === inc) {
        $txs = txs; // add the transactions to the last block
      }
      ctx.network.current = await blockDB.mine(ctx.network.blocks, ctx.network.current, $txs);
      ctx.network.height = ctx.network.height + 1;
      ctx.network.blocks = ctx.network.blocks + 1;
    }

    await transactionDB.mineTxs(ctx.network.current, unverifiedBundleTxs);

    ctx.body = ctx.network;
  } catch (error) {
    console.error({ error });
  }
}
export async function mineWithFailsRoute(ctx: Router.RouterContext) {
  try {
    if (!blockDB || connectionSettings !== ctx.connection.client.connectionSettings.filename || !transactionDB) {
      blockDB = new BlockDB(ctx.connection);
      transactionDB = new TransactionDB(ctx.connection);
      connectionSettings = ctx.connection.client.connectionSettings.filename;
    }

    console.log(`Fails percentage set to ${ctx.fails * 100}%`);

    const txs = [];
    const unminedTxs = await transactionDB.getUnminedTxs();
    unminedTxs.forEach(async (tx) => {
      const fail = Math.random() < ctx.fails;
      if (fail) {
        await transactionDB.deleteById(tx);
      } else {
        txs.push(tx);
      }
    });

    const inc = +(ctx.params?.qty || 1);

    ctx.network.current = await blockDB.mine(ctx.network.blocks, ctx.network.current, txs);
    ctx.network.height = ctx.network.height + inc;
    ctx.network.blocks = ctx.network.blocks + inc;

    await transactionDB.mineTxs(ctx.network.current, []);

    ctx.body = ctx.network;
  } catch (error) {
    console.error({ error });
  }
}
