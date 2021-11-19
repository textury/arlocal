import ArLocal from './app';
import Ardb from 'ardb';
import Blockweave from 'blockweave';
import { JWKInterface } from 'blockweave/dist/faces/lib/wallet';

export let blockweave: Blockweave;
export let ardb: Ardb;
export let server;
export let port: number;
export let wallet: JWKInterface;
let arLocalTesting: ArLocal;

jest.setTimeout(30000);
beforeEach(async () => {
  port = Math.floor(Math.random() * (9000 - 5000 + 1) + 5000);
  const url = `http://127.0.0.1:${port}`;

  arLocalTesting = new ArLocal(port);
  await arLocalTesting.start();
  server = arLocalTesting.getServer();

  blockweave = new Blockweave(
    {
      url,
      host: '127.0.0.1',
      port,
      protocol: 'http',
      timeout: 20000,
      logging: true,
    },
    [url],
  );
  wallet = await blockweave.wallets.generate();
  const address = await blockweave.wallets.getAddress(wallet);
  arLocalTesting.getWalletDb().addWallet({ address, balance: 100000000000000 });

  //@ts-ignore
  ardb = new Ardb(blockweave);

  jest.spyOn(console, 'error');
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockImplementation(() => null);
});
afterEach(async () => {
  await arLocalTesting.stop();

  server = null;
  blockweave = null;
  blockweave = null;
  ardb = null;
  port = null;

  jest.spyOn(console, 'error');
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockRestore();
});
