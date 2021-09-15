import { Server } from 'http';
import { rmSync, mkdirSync } from 'fs';
import path from 'path';
import Koa, { BaseContext } from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import json from 'koa-json';
import logger from 'koa-logger';
import { ApolloServer } from 'apollo-server-koa';
import { Knex } from 'knex';
import { connect } from './db/connect';
import { down, up } from './db/initialize';
import { graphServer } from './graphql/server';
import { dataRouteRegex, dataHeadRoute, dataRoute } from './routes/data';
import { mineRoute } from './routes/mine';
import { statusRoute } from './routes/status';
import { txAnchorRoute, txRoute, txPostRoute } from './routes/transaction';
import { Utils } from './utils/utils';
import { NetworkInterface } from './faces/network';
import Logging from './utils/logging';
import { blocksRoute } from './routes/blocks';
import { createWalletRoute, getBalanceRoute, getLastWalletTxRoute, updateBalanceRoute } from './routes/wallet';

declare module 'koa' {
  interface BaseContext {
    connection: Knex;
    network: NetworkInterface;
    transactions: string[];
    dbPath: string;
    logging: Logging;
  }
}

export default class ArLocal {
  private port: number = 1984;
  private dbPath: string;
  private log: Logging;

  private connection: Knex;
  private apollo: ApolloServer;

  private server: Server;
  private app = new Koa();
  private router = new Router();

  constructor(port: number = 1984, showLogs: boolean = true, dbPath?: string) {
    this.port = port || this.port;
    dbPath = dbPath || path.join(__dirname, '.db', port.toString());

    this.dbPath = dbPath;

    this.log = new Logging(showLogs);

    this.connection = connect(dbPath);

    this.app.context.network = {
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

    this.app.context.logging = this.log;
    this.app.context.transactions = [];
    this.app.context.dbPath = dbPath;
    this.app.context.connection = this.connection;
  }

  async start() {
    await this.startDB();

    this.router.get('/', statusRoute);
    this.router.get('/info', statusRoute);
    this.router.get('/mine/:qty?', mineRoute);

    this.router.get('/tx_anchor', txAnchorRoute);
    this.router.get('/price/:bytes/:addy?', async (ctx) => (ctx.body = +ctx.params.bytes * 1965132));

    this.router.get('/tx/:txid', txRoute);
    this.router.post('/tx', txPostRoute);

    this.router.get('/block/hash/:indep_hash', blocksRoute);

    this.router.post('/wallet', createWalletRoute);
    this.router.patch('/wallet/:address/balance', updateBalanceRoute);

    this.router.get('/wallet/:address/balance', getBalanceRoute);
    this.router.get('/wallet/:address/last_tx', getLastWalletTxRoute);

    this.router.head(dataRouteRegex, dataHeadRoute);
    this.router.get(dataRouteRegex, dataRoute);

    this.router.get('/:other', (ctx) => {
      ctx.type = 'application/json';
      ctx.body = {
        status: 400,
        error: 'Request type not found.',
      };
    });

    this.app.use(cors());
    this.app.use(json());
    this.app.use(
      logger({
        transporter: (str) => {
          this.log.log(str);
        },
      }),
    );
    this.app.use(bodyParser());
    this.app.use(this.router.routes()).use(this.router.allowedMethods());

    this.server = this.app.listen(this.port, () => {
      console.log(`arlocal started on port ${this.port}`);
    });
  }

  private async startDB() {
    // Delete old database
    try {
      rmSync(this.dbPath, { recursive: true });
    } catch (e) {}

    mkdirSync(this.dbPath, { recursive: true });

    // sqlite
    this.apollo = graphServer(
      {
        introspection: true,
        playground: true,
      },
      this.connection,
    );

    this.apollo.applyMiddleware({ app: this.app, path: '/graphql' });

    await up(this.connection);
  }

  async stop() {
    if (this.server) {
      this.server.close((err) => {
        if (err) {
          try {
            rmSync(this.dbPath, { recursive: true });
          } catch (err) {}
          return;
        }
      });
    }

    down(this.connection)
      .then(() => {
        this.apollo
          .stop()
          .then(() => {
            this.connection
              .destroy()
              .then(() => {
                try {
                  rmSync(this.dbPath, { recursive: true });
                } catch (e) {}
              })
              .catch(() => {});
          })
          .catch(() => {});
      })
      .catch(() => {});
  }

  getServer(): Server {
    return this.server;
  }
}
