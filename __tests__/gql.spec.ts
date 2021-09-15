import { createTransaction } from '../src/utils/tests';
import { blockweave, ardb } from '../test-setup';
jest.setTimeout(100000);
describe('TRANSACTION', () => {
  it('gets 10 txs', async () => {
    const data = 'test';
    let i = 12;
    while (i--) await createTransaction(blockweave, `${data} : ${i}`);

    const res1 = (await ardb.search('transactions').find()) as any;
    const res2 = (await ardb.next()) as any;

    expect(res1.length).toEqual(10);
    expect(res2.length).toEqual(2);
  });
});

describe('BLOCK', () => {});
