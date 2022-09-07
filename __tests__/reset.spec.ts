import { blockweave, port } from '../src/test-setup';
import Arweave from 'arweave';

describe('RESET', () => {
  it('resets the network info', async () => {
    let {
      data: { height, blocks },
    } = await blockweave.api.get('/');

    expect(height).toEqual(0);
    expect(blocks).toEqual(1);

    await blockweave.api.get('/mine/50');

    let info = await blockweave.api.get('/');
    height = info.data.height;
    blocks = info.data.blocks;
    expect(height).toEqual(50);
    expect(blocks).toEqual(51);

    const b = await blockweave.api.get('/reset');
    expect(b.status).toEqual(200);

    info = await blockweave.api.get('/');
    height = info.data.height;
    blocks = info.data.blocks;
    expect(height).toEqual(0);
    expect(blocks).toEqual(1);
  });
  it('resets the db', async () => {
    const wallet = 'QzBMrsrA_XVNEdGSYWcrIz0yx866ZmjZG61ZekCxRdI';
    let balance = await blockweave.wallets.getBalance(wallet);
    expect(+balance).toEqual(0);

    await blockweave.api.get(`/mint/${wallet}/500`);
    let b = await blockweave.api.get(`/wallet/${wallet}/balance`);
    balance = b.data;
    expect(balance).toEqual(500);

    await blockweave.api.get('/reset');
    b = await blockweave.api.get(`/wallet/${wallet}/balance`);
    balance = b.data;
    expect(balance).toEqual(0);
  });
  it('Gets current block', async () => {
    const arweave = Arweave.init({
      host: 'localhost',
      port,
      protocol: 'http',
    });
    let result = await arweave.blocks.getCurrent();
    expect(result).toBeDefined();
    await blockweave.api.get('/reset');
    result = await arweave.blocks.getCurrent();
    expect(result).toBeDefined();
  });
});
