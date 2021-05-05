import fs from 'fs';
import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-body';
import cors from '@koa/cors';

import { Utils } from './utils/utils';
import { connection } from './db/connection';
import { up } from './db/initialize';
import { graphServer } from './graphql/server';
import { statusRoute } from './routes/status';
import { mineRoute } from './routes/mine';
import { dataRouteRegex, dataHeadRoute, dataRoute } from './routes/data';
import { txRoute, txPostRoute, txAnchorRoute } from './routes/transaction';

const app = new Koa();
const router = new Router();

app.context.network = {
  network: 'arlocal.N.1',
  version: 1,
  release: 1,
  queue_length: 0,
  peers: 0,
  height: 0,
  current: Utils.randomID(64),
  blocks: 0,
  node_state_latency: 0,
};

app.context.transactions = [];

async function start() {
  await startDB();

  router.get('/', statusRoute);
  router.get('/info', statusRoute);
  router.get('/mine/:qty?', mineRoute);
  
  router.get('/tx_anchor', txAnchorRoute);
  router.get('/price/:price/:addy?', async ctx => ctx.body = ctx.params.price * 1965132);

  router.get('/tx/:txid', txRoute);
  router.post('/tx', txPostRoute);

  router.head(dataRouteRegex, dataHeadRoute);
  router.get(dataRouteRegex, dataRoute);

  app.use(cors());
  app.use(json());
  app.use(logger());
  app.use(bodyParser());
  app.use(router.routes()).use(router.allowedMethods());

  app.listen(1984, () => {
    console.log('arlocal started on port 1984');
  });
}

async function startDB() {
  // Delete old database
  fs.rmdirSync('./db', { recursive: true });
  fs.mkdirSync('./db');

  // sqlite
  graphServer({
    introspection: true,
    playground: true,
  }).applyMiddleware({app, path: '/graphql'});

  await up(connection);
}

start();