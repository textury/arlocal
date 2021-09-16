import { blockweave } from '../test-setup';

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
    
    const transaction = await blockweave.createTransaction({
      data: 'test',
    }, jwk);
    await transaction.sign(jwk);
    await transaction.post();

    const transaction2 = await blockweave.createTransaction({
      data: 'test',
    }, jwk);
    await transaction2.sign(jwk);
    await transaction2.post();

    const lastTx = await blockweave.wallets.getLastTransactionId(address);
    expect(typeof lastTx).toBe('string');
    expect(transaction.owner).toBe(transaction2.owner);
  });
});
