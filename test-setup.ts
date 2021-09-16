import ArLocal from './src/app';
import Ardb from 'ardb';
import Blockweave from 'blockweave';

export let blockweave: Blockweave;
export let ardb: Ardb;
export let server;
let arLocalTesting: ArLocal;

jest.setTimeout(30000);
beforeEach(async () => {
  const port = Math.floor(Math.random() * (9000 - 5000) + 5000);

  arLocalTesting = new ArLocal(port);
  await arLocalTesting.start();
  server = arLocalTesting.getServer();

  blockweave = new Blockweave(
    {
      host: '127.0.0.1',
      port,
      protocol: 'http',
      timeout: 20000,
      logging: false,
    },
    [`http://127.0.0.1:${port}`],
  );

  const url = `http://localhost:${port}`;
  // blockweave = new Blockweave({ url })
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

  jest.spyOn(console, 'error');
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockRestore();
});
