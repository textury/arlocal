import { readFile } from 'fs/promises';
import request from 'supertest';
import bytes from "bytes";

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

  it.only('should not duplicate data in txt file after subsequent uploads', async () => {
    const arweave = Arweave.init({
      host: '127.0.0.1',
      port,
      protocol: 'http',
    });

    const data = Buffer.alloc(bytes("2mb"), "hello_world");
    const fileContent = data.toString('binary');

    const wallet = await arweave.wallets.generate();
    const walletAddress = await arweave.wallets.jwkToAddress(wallet);
    await request(server).get(`/mint/${walletAddress}/100000000000000000000`);

    const tx = await arweave.createTransaction(
      {
        data,
      },
      wallet,
    );

    tx.addTag('App-Name', 'arweave');
    tx.addTag('Content-Type', 'text/html');

    // post tx twice
    await arweave.transactions.sign(tx, wallet);
    await arweave.transactions.post(tx);
    const res = await request(server).get(`/${tx.id}`);
    expect(res.text).toEqual(fileContent);

    const tx2 = await arweave.createTransaction(
      {
        data,
      },
      wallet,
    );

    tx2.addTag('App-Name', 'arweave');
    tx2.addTag('Content-Type', 'text/html');

    await arweave.transactions.sign(tx2, wallet);
    await arweave.transactions.post(tx2);
    const res2 = await request(server).get(`/${tx2.id}`);

    // get the first tx again
    const res3 = await request(server).get(`/${tx.id}`)
    expect(res2.text).toEqual(fileContent);
    expect(res3.text).toEqual(fileContent);
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
