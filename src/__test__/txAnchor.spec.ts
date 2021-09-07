import request from 'supertest';
import { createTransaction } from '../utils/tests';
import { server, arweave } from '../../test-setup';

describe('txAnchor ENDPOINT', () => {
  it("returns a transaction's ID", async () => {
    const tx = await createTransaction(arweave);
    const res = await request(server).get('/tx_anchor');
    expect(res.text).toEqual(tx);
  });

  it('returns an ID when no transaction is found', async () => {
    const res = await request(server).get('/tx_anchor');
    expect(res.text).toHaveLength(43);
  });
});
