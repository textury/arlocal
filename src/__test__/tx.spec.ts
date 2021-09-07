import request from 'supertest';
import { createTransaction, getTx } from '../utils/tests';
import { arweave, server, ardk } from '../../test-setup';

describe('tx/:txid ENDPOINT', () => {
  it('returns a transaction', async () => {
    const tx = await createTransaction(arweave);
    const transaction = await getTx(arweave, tx);

    console.log('tx', tx);
    console.log('tr', transaction.id);

    expect(transaction.id).toEqual(tx);
  });

  it('ardk', async () => {
    let key = await ardk.wallets.generate();

    // Plain text
    let transaction = await ardk.createTransaction(
      {
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body></body></html>',
      },
      key,
    );
    transaction.addTag('Content-Type', 'text/html');
    transaction.addTag('key2', 'value2');
    await transaction.sign();
    await transaction.post();
  });
});

describe('POST /tx ENDPOINT', () => {
  const data = {
    format: 2,
    id: 'BNttzDav3jHVnNiV7nYbQv-GY0HQ-4XXsdkE5K9ylHQ',
    last_tx: 'jUcuEDZQy2fC6T3fHnGfYsw0D0Zl4NfuaXfwBOLiQtA',
    owner: 'posmE...psEok',
    tags: [{ name: 'BBBB', value: 'AAAA' }],
    target: '',
    quantity: '0',
    data_root: 'PGh0b...RtbD4',
    data: 'hello world',
    data_size: '1234235',
    reward: '124145681682',
    signature: 'HZRG_...jRGB-M',
  };

  it('creates a transaction', async () => {
    const res = await request(server)
      .post(`/tx`)
      .send({ ...data });

    expect(res.body.id).toEqual(data.id);
    expect(res.body.last_tx).toEqual(data.last_tx);
    expect(res.body.owner).toEqual(data.owner);
    expect(res.body.data).toEqual(data.data);
    expect(res.body.data_size).toEqual(data.data_size);
    expect(res.body.signature).toEqual(data.signature);
  });
});
