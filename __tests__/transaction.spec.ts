import request from 'supertest';
import { blockweave, server } from '../test-setup';
import { createTransaction } from '../src/utils/tests';
import { Utils } from '../src/utils/utils';

jest.setTimeout(20000);

describe('TX', () => {
  it('GET /tx/:txid', async () => {
    const txid = await createTransaction(blockweave, 'test');

    expect(txid).toBeDefined();
    // Call the endpoint directly
    const res = await request(server).get(`/tx/${txid}`);

    expect(res.body.id).toEqual(txid);
  });
});
