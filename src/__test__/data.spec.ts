import request from 'supertest';
import { createTransaction } from '../utils/tests';
import { server, arweave } from '../../test-setup';

describe('DATA ENDPOINT', () => {
  it("gets a tx's data", async () => {
    const data = 'test';
    const tx = await createTransaction(arweave, data);
    const res = await request(server).get(`/${tx}`);

    expect(res.text).toEqual(data);
  });

  it('returns when transaction is not found', async () => {
    const res = await request(server).get(`/IjY5DDDUr-2UZQrAA8NGHgCuYdvIVEV9LZkFHmsO_oM`);
    expect(res.statusCode).toEqual(404);
  });
});
