import { createTransaction } from '../src/utils/tests';
import { blockweave, ardb } from '../test-setup';
jest.setTimeout(30000);
describe('TRANSACTION', () => {
  it('gets a tx', async () => {
    const data = 'test';
    const id = await createTransaction(blockweave, data);
    const res = (await ardb.search('transaction').id(id).find()) as any;
    expect(res.id).toEqual(id);
  });

  it('gets 10 txs then 2 ', async () => {
    const data = 'test';
    let i = 12;
    while (i--) await createTransaction(blockweave, data + i);
    const res1 = (await ardb.search('transactions').find()) as any;
    const res2 = (await ardb.next()) as any;

    console.log({ res1 });
    console.log({ res2 });

    expect(res2.length).toEqual(2);
    expect(res1.length).toEqual(10);
  });
});

describe('BLOCK', () => {});
