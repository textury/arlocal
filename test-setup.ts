import { dirname } from 'path';
import { rmdirSync } from 'fs';

import ArLocal from './src/app';
import Arweave from 'arweave';
import Ardb from 'ardb';
import Ardk from 'ardk';

export let server;
export let app;
export let arweave;
export let ardk: Ardk;
export let ardb: Ardb;
export let basePrice;
let arLocalTesting: ArLocal;
beforeEach(async () => {
  const port = Math.floor(Math.random() * (9000 - 5000) + 5000);

  arLocalTesting = new ArLocal(port);
  await arLocalTesting.start();

  server = arLocalTesting.getServer();
  app = arLocalTesting.getApp();
  basePrice = arLocalTesting.getBasePrice();

  arweave = Arweave.init({
    host: 'localhost',
    protocol: 'http',
    port: port,
    logging: true,
  });
  const url = `http://localhost:${port}`;
  ardk = new Ardk(
    {
      url,
      logging: true,
    },
    [url],
  );
  ardb = new Ardb(arweave);
});
afterEach(async () => {
  await arLocalTesting.stop();

  server = null;
  app = null;
  basePrice = null;
  arweave = null;
  ardk = null;
  ardb = null;
});

afterAll(async () => {
  rmdirSync(dirname(arLocalTesting.getDbPath()), { recursive: true });
});
