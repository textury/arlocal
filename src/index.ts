import fs from 'fs';
import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-body';
import Nedb from 'nedb';
import { Network } from './lib/network';
import { Utils } from './lib/utils';

const app = new Koa();
const router = new Router();

// DB should be emptied on every run.
const txsDbFile = '.txsdb';
const blocksDbFile = '.blocksdb';
if(fs.existsSync(txsDbFile)) {
  fs.unlinkSync(txsDbFile);
}
if(fs.existsSync(blocksDbFile)) {
  fs.unlinkSync(blocksDbFile);
}
const db = {
  txs: new Nedb({filename: txsDbFile}),
  blocks: new Nedb({filename: blocksDbFile})
};
db.txs.loadDatabase(err => {
  if(err) console.log(err);
});
db.blocks.loadDatabase(err => {
  if(err) console.log(err);
});

const network = new Network();

router.get('/', '/info', async (ctx, next) => {
  ctx.body = network.toJSON();

  await next();
});

router.post('/tx', async (ctx, next) => {
  const data = ctx.request.body;

  console.log(data);
  db.txs.insert(data, async (err, newDoc) => {
    if(err) console.log(err);
  });

  ctx.body = data;
  await next();
});

router.get('/tx/:txid', async (ctx, next) => {
  const tx = await new Promise(resolve => {
    db.txs.findOne({id: ctx.params.txid}, async (err, doc) => {
      if(err) console.log(err);

      resolve(doc);
    });
  });

  ctx.body = tx;
  await next();
});

router.get('/tx_anchor', async (ctx, next) => {
  ctx.body = Utils.randomID();
});

router.get('/price/:price', async (ctx, next) => {
  ctx.body = ctx.params.price * 1965132;
});

app.use(json());
app.use(logger());
app.use(bodyParser());

app.use(router.routes()).use(router.allowedMethods());
app.listen(1984, () => {
  console.log('arlocal started on port 1984');
});