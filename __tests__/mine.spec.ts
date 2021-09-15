import { NetworkInfoInterface } from 'blockweave/dist/faces/lib/network';
import request from 'supertest';
import { blockweave, server } from '../test-setup';

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
});
