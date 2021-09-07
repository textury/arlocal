import { createTransaction } from '../utils/tests';
import { arweave, ardb, server } from '../../test-setup';
jest.setTimeout(30000);
describe('TRANSACTION', () => {
  it('gets a tx', async () => {
    const data = 'test';
    const id = await createTransaction(arweave, data);
    const res = (await ardb.search('transaction').id(id).find()) as any;
    expect(res.id).toEqual(id);
  });

  it('gets 10 txs then 5 ', async () => {
    const data = 'test';
    let i = 11;
    while (i--) await createTransaction(arweave, data + i);
    const res = (await ardb.search('transactions').find()) as any;
    console.log({ res });

    expect(res.length).toEqual(10);
  });

  it('gets 5 txs after the first 10', async () => {
    const data = 'test';
    let i = 15;
    while (i--) await createTransaction(arweave, data + i);
    await ardb.search('transactions').find();
    const res = (await ardb.next()) as any;

    expect(res.length).toEqual(5);
  });
});

describe('BLOCK', () => {});
