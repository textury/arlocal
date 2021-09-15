import { createTransaction } from '../src/utils/tests';
import { blockweave, ardb } from '../test-setup';
jest.setTimeout(100000);
describe('TRANSACTION', () => {
  it('gets 10 txs', async () => {
    const data = 'test';
    let i = 12;
    // while (i--)
    await createTransaction(blockweave, data + i);
    const res1 = (await ardb.search('transactions').find()) as any;

    expect(res1.length).toEqual(1);
  });

  it('gets a tx', async () => {
    const data = 'test';
    const id = await createTransaction(blockweave, data);
    const res = (await ardb.search('transaction').id(id).find()) as any;
    expect(res.id).toEqual(id);
  });
});

describe('BLOCK', () => {});
