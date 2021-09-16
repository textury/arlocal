import { blockweave, server } from '../test-setup';
import supertest from 'supertest';

describe('WALLETS', () => {
  it('POST /wallet', async () => {
    const jwk = await blockweave.wallets.generate();
    const address = await blockweave.wallets.getAddress(jwk);
    
    expect(typeof address).toBe('string');
  });

  it('GET /wallet/:address/balance', async () => {
    const jwk = await blockweave.wallets.generate();
    const address = await blockweave.wallets.getAddress(jwk);
    
    const res = await supertest(server).get(`/wallet/${address}/balance`);
    expect(typeof res.text).toBe('string');
    expect(res.text).toEqual('0');
  });

  it('GET /wallet/:address/last_tx', async () => {
    const jwk = await blockweave.wallets.generate();
    const address = await blockweave.wallets.getAddress(jwk);
    
    const transaction = await blockweave.createTransaction({
      data: 'test',
    }, jwk);
    await transaction.sign(jwk);
    await transaction.post();

    const res = await supertest(server).get(`/wallet/${address}/last_tx`);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.id).toBe('string');
    expect(res.body.id).toEqual(transaction.id);
  });
});
