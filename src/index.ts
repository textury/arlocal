import fs from 'fs';
import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-body';
import Nedb from 'nedb';
import {parse} from 'graphql';
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

router.get('/', async ctx => {
  ctx.body = network.toJSON();
});

router.get('/favicon.ico', ctx => {
  ctx.status = 404;
});

router.get('/info', async ctx => {
  ctx.body = network.toJSON();
});

router.post('/tx', async ctx => {
  const data = ctx.request.body;

  console.log(data);
  await new Promise((resolve, reject) => {
    db.txs.insert(data, async (err, newDoc) => {
      if(err) {
        return reject(err);
      }
      resolve(newDoc);
    });
  });

  ctx.body = data;
});

router.post('/graphql', async ctx => {
  const {query} = ctx.request.body;
  const gql = parse(query);

  // @ts-ignore
  const search = gql.definitions[0].selectionSet.selections[0].name.value;
  // @ts-ignore
  const tags = gql.definitions[0].selectionSet.selections[0].arguments[0].value.values.map(t => {
    return {name: Utils.btoa(t.fields[0].value.value).replace(/=/g, ''), value: Utils.btoa(t.fields[1].value.values[0].value).replace(/=/g, '')};
  });

  console.log(tags);

  const res = await new Promise((resolve, reject) => {
    db.txs.find({tags: tags[0]}, (err, docs) => {
      if(err) {
        console.log(err);
        return reject(err);
      }

      console.log(docs);
      resolve(docs);
    });
  });

  ctx.body = res;
});

router.get('/tx/:txid', async ctx => {
  console.log(ctx.params.txid);
  const tx = await new Promise((resolve, reject) => {
    db.txs.findOne({id: ctx.params.txid}, async (err, doc) => {
      if(err) {
        return reject(err);
      }

      delete doc._id;
      console.log(doc);
      resolve(doc);
    });
  });

  ctx.body = tx;
});

router.get('/tx_anchor', async ctx => {
  ctx.body = Utils.randomID();
});

router.get('/price/:price', async ctx => {
  ctx.body = ctx.params.price * 1965132;
});

router.get('/mine/:qty?', ctx => {
  const qty = (ctx.params && ctx.params.qty)? +ctx.params.qty : 1;
  network.increment(qty);

  ctx.body = network.toJSON();
})

router.get('/:txid', async ctx => {
  const { body, contentType } = await new Promise((resolve, reject) => {
    db.txs.findOne({id: ctx.params.txid}, async (err, doc) => {
      if(err) {
        return reject(err);
      }

      console.log(doc);

      let contentType: string = null;
      for(const tag of doc.tags) {
        if(tag.name === 'Q29udGVudC1UeXBl') {
          contentType = Utils.atob(tag.value);
          break;
        }
      }

      resolve({
        contentType,
        body: Utils.atob(doc.data)
      });
    });
  });
  
  if(contentType) ctx.response.header['Content-Type'] = contentType;
  ctx.body = body;
});

app.use(json());
app.use(logger());
app.use(bodyParser());

app.use(router.routes()).use(router.allowedMethods());
app.listen(1984, () => {
  console.log('arlocal started on port 1984');
});