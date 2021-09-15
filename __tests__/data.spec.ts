import { blockweave } from '../test-setup';
import { createTransaction } from '../src/utils/tests';

jest.setTimeout(20000);
describe('DATA ENDPOINT', () => {
  it("gets a tx's data", async () => {
    const data = 'test'; // dGVzdA
    const tx = await createTransaction(blockweave, data);
    const res = await blockweave.transactions.getData(tx);

    expect(res).toEqual('dGVzdA');
  });
});
