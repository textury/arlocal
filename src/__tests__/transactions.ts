import Arlocal from '../app';
import Blockweave from 'blockweave';

describe('Transactions', () => {
  let blockweave: Blockweave;
  const arlocal: Arlocal = new Arlocal();

  jest.setTimeout(20000);
  beforeAll(async () => {
    await arlocal.start();
    blockweave = new Blockweave({
      host: '127.0.0.1',
      port: '1984',
      protocol: 'http',
      timeout: 20000,
      logging: false,
    });
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  beforeEach(() => {
    jest.spyOn(console, 'error');
    // @ts-ignore jest.spyOn adds this functionallity
    console.error.mockImplementation(() => null);
  });

  afterEach(() => {
    // @ts-ignore jest.spyOn adds this functionallity
    console.error.mockRestore();
  });

  // Test for transaction anchor
  describe('GET /tx_anchor', async () => {

  });
  // Write test for creation of transaction
  describe('POST /tx', async () => {

  });
  // Write test for fetching transactions
  describe('GET /tx/:txid', async () => {

  });
});
