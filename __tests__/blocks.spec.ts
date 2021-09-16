import request from 'supertest';
import { blockweave, ardb, server } from '../test-setup';
import { createTransaction } from '../src/utils/tests';

describe('BLOCK', () => {
  it('GET /block/hash/:indep_hash', async () => {
    const data = 'test';
    // Create a transaction 
    const txid = await createTransaction(blockweave, data);
    const block = (await blockweave.network.getInfo()).current
    const res = await request(server).get(`/block/hash/${block}`);
    // use direct api call to get the block 
    expect(res.body.indep_hash).toEqual(block);
  });
});
