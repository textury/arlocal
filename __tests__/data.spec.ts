import { blockweave } from '../test-setup';
import { createTransaction } from '../src/utils/tests';
import { Utils } from '../src/utils/utils';

describe('DATA ENDPOINT', () => {
  it("gets a tx's data", async () => {
    const data = 'test';
    const tx = await createTransaction(blockweave, data);
    const res = await blockweave.transactions.getData(tx);

    // expect(Utils.atob(res as string)).toEqual(data);
    expect(res).toEqual(Utils.btoa(data));
  });
});
