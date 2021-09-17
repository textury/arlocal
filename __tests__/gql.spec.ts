import { createTransaction, mine } from '../src/utils/tests';
import { blockweave, ardb } from '../test-setup';
jest.setTimeout(100000);
describe('TRANSACTION', () => {
  it('gets 10 txs then 2', async () => {
    const data = 'test';
    let i = 12;
    while (i--) await createTransaction(blockweave, `${data} : ${i}`);

    const res1 = (await ardb.search('transactions').find()) as any;
    const res2 = (await ardb.next()) as any;

    expect(res1.length).toEqual(10);
    expect(res2.length).toEqual(2);
  });

  it('filter on min and max block height 1', async () => {
    const data = 'test';

    await createTransaction(blockweave, `${data} : 1`);
    await mine(blockweave);

    await createTransaction(blockweave, `${data} : 2`);
    await mine(blockweave);

    const res = (await ardb.search('transactions').find({ block: { min: 1, max: 1 } })) as any;

    expect(res.length).toEqual(1);
  });

  it('filter on min and max block height 2', async () => {
    const data = 'test';
    let i = 5;
    while (i--) {
      await createTransaction(blockweave, `${data} : ${i}`);
      await mine(blockweave);
    }

    const res = (await ardb.search('transactions').find({ block: { min: 3, max: 5 } })) as any;

    expect(res.length).toEqual(3);
  });
});

describe('BLOCK', () => {
  it('gets 10 blocks then 2', async () => {
    let i = 12;
    while (i--) await mine(blockweave);

    const res1 = (await ardb.search('blocks').find()) as any;
    const res2 = (await ardb.next()) as any;

    expect(res1.length).toEqual(10);
    expect(res2.length).toEqual(2);
  });
});
