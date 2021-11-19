import { NetworkInfoInterface } from 'blockweave/dist/faces/lib/network';
import request from 'supertest';
import { blockweave, server } from '../src/test-setup';

describe('MINE ENDPOINT', () => {
  it('mines one block', async () => {
    const res = await request(server).get('/mine');
    expect(res.body.height).toEqual(1);
  });

  it('mines three blocks', async () => {
    const res = await request(server).get('/mine/3');
    const info: NetworkInfoInterface = await blockweave.network.getInfo();
    expect(res.body.height).toEqual(3);
    expect(info.height).toEqual(3);
  });

  it('mines one hundred blocks', async () => {
    const res = await request(server).get('/mine/100');
    const info: NetworkInfoInterface = await blockweave.network.getInfo();

    expect(res.body.height).toEqual(100);
    expect(info.height).toEqual(100);
  });

  it('mines a block with a transaction', async () => {
    const wallet = await blockweave.wallets.generate();
    const address = await blockweave.wallets.getAddress(wallet);
    await request(server).get(`/mint/${address}/100000000000000000000`);

    const tx = await blockweave.createTransaction(
      {
        data: 'hello world',
      },
      wallet,
    );
    tx.addTag('App-Name', 'blockWeave');
    tx.addTag('Content-Type', 'text/plain');

    await blockweave.transactions.sign(tx, wallet);
    await blockweave.transactions.post(tx);
    await request(server).get('/mine');

    const transaction = await blockweave.transactions.get(tx.id);

    expect(transaction.owner).toEqual(tx.owner);
  });
});
