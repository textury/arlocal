import { readFile } from 'fs/promises';
import request from 'supertest';

import { blockweave, port, server } from '../src/test-setup';
import Arweave from 'arweave';
import { b64UrlDecode, bufferTob64 } from '../src/utils/encoding';

describe('CHUNK', () => {
  it('arweave', async () => {
    const arweave = Arweave.init({
      host: '127.0.0.1',
      port,
      protocol: 'http',
    });
    const data = await readFile(`${process.cwd()}/__tests__/data/wallpaper.jpg`);
    console.log('file_data: ', data)

    const wallet = await arweave.wallets.generate();
    const walletAddress = await arweave.wallets.jwkToAddress(wallet);
    await request(server).get(`/mint/${walletAddress}/100000000000000000000`);

    const tx = await arweave.createTransaction(
      {
        data,
      },
      wallet,
    );
    tx.addTag('App-Name', 'blockWeave');
    tx.addTag('Content-Type', 'image/jpg');

    await arweave.transactions.sign(tx, wallet);
    await arweave.transactions.post(tx);
    console.log('tx: ', tx)
    const transaction = await arweave.transactions.getData(tx.id);

    expect(b64UrlDecode(transaction as string)).toEqual(bufferTob64(data));
  });

  it('blockweave', async () => {
    const data = await readFile(`${process.cwd()}/__tests__/data/wallpaper.jpg`);

    const wallet = await blockweave.wallets.generate();
    const walletAddress = await blockweave.wallets.jwkToAddress(wallet);
    await request(server).get(`/mint/${walletAddress}/100000000000000000000`);

    const tx = await blockweave.createTransaction(
      {
        data,
      },
      wallet,
    );

    tx.addTag('App-Name', 'blockWeave');
    tx.addTag('Content-Type', 'image/jpg');

    await blockweave.transactions.sign(tx, wallet);
    await blockweave.transactions.post(tx);
    const transaction = await blockweave.transactions.getData(tx.id);

    expect(b64UrlDecode(transaction as string)).toEqual(bufferTob64(data));
  });
});
