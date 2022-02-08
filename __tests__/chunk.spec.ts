import { readFile } from 'fs/promises';
import request from 'supertest';

import { blockweave, port, server } from '../src/test-setup';
import Arweave from 'arweave';
import { b64UrlDecode, bufferTob64 } from '../src/utils/encoding';

describe('CHUNK', () => {
  describe('Arweave', () => {
  it('Wallpaper', async () => {
    const arweave = Arweave.init({
      host: '127.0.0.1',
      port,
      protocol: 'http',
    });
    const data = await readFile(`${process.cwd()}/__tests__/data/wallpaper.jpg`);

    const wallet = await arweave.wallets.generate();
    const walletAddress = await arweave.wallets.jwkToAddress(wallet);
    await request(server).get(`/mint/${walletAddress}/100000000000000000000`);

    const tx = await arweave.createTransaction(
      {
        data,
      },
      wallet,
    );
    tx.addTag('Content-Type', 'image/jpg');

    await arweave.transactions.sign(tx, wallet);
    await arweave.transactions.post(tx);

    const transaction = await arweave.transactions.getData(tx.id);
    expect(b64UrlDecode(transaction as string)).toEqual(bufferTob64(data));
  });
  it('Lion video', async () => {
    const arweave = Arweave.init({
      host: '127.0.0.1',
      port,
      protocol: 'http',
    });

    const wallet = await arweave.wallets.generate();

    const walletAddress = await arweave.wallets.getAddress(wallet);
    await arweave.api.get('mint/' + walletAddress + '/10000000000000000');
    const data = await readFile(`${process.cwd()}/__tests__/data/lion.mp4`);
    const transaction = await arweave.createTransaction(
      {
        data,
      },
      wallet,
    );
    transaction.addTag('Content-Type', 'video/mp4');

    await arweave.transactions.sign(transaction, wallet);
    await arweave.transactions.post(transaction);
    
    const txData = await arweave.transactions.getData(transaction.id);
    expect(b64UrlDecode(txData as string)).toEqual(bufferTob64(data));
  });
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
