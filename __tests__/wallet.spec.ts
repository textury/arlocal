import { blockweave, server } from '../test-setup';
import request from 'supertest';

describe('WALLETS', () => {
  it('POST /wallet', async () => {
    const jwk = await blockweave.wallets.generate();
    const address = await blockweave.wallets.getAddress(jwk);

    expect(typeof address).toBe('string');
  });

  it('GET /wallet/:address/balance', async () => {
    const jwk = await blockweave.wallets.generate();
    const address = await blockweave.wallets.getAddress(jwk);

    const balance = await blockweave.wallets.getBalance(address);
    expect(typeof balance).toBe('string');
  });

  it('GET /wallet/:address/last_tx', async () => {
    const jwk = await blockweave.wallets.generate();
    const address = await blockweave.wallets.getAddress(jwk);

    const transaction = await blockweave.createTransaction(
      {
        data: 'test',
      },
      jwk,
    );
    await transaction.sign(jwk);
    await transaction.post();

    const transaction2 = await blockweave.createTransaction(
      {
        data: 'test',
      },
      jwk,
    );
    await transaction2.sign(jwk);
    await transaction2.post();

    const lastTx = await blockweave.wallets.getLastTransactionId(address);
    expect(typeof lastTx).toBe('string');
    expect(transaction.owner).toBe(transaction2.owner);
  });

  it('adds balance to wallet', async () => {
    const address = 'pLPrkgQBFCpaJm1DIksYSPaeMNy6evqoLPCPAlZ-YG8';
    const res1 = await request(server).post('/wallet').send({
      address,
      balance: 1,
    });

    expect(res1.body.address).toEqual(address);
    expect(res1.body.balance).toEqual(1);

    await request(server).get(`/mint/${address}/100`);

    const res2 = await request(server).get(`/wallet/${address}/balance`);
    expect(res2.text).toEqual('101');
  });

  it('create wallet if doesnt exists', async () => {
    const address = 'pLPrkgQBFCpaJm1DIksYSPaeMNy6evqoLPCPAlZ-YG8';
    const res1 = await request(server).get(`/wallet/${address}/balance`);
    expect(res1.text).toEqual('0');

    await request(server).get(`/mint/${address}/100`);

    const res2 = await request(server).get(`/wallet/${address}/balance`);
    expect(res2.text).toEqual('100');
  });
});
