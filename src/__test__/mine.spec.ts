import request from 'supertest';
import { server } from '../../test-setup';

describe('MINE ENDPOINT', () => {
  it('mines one block', async () => {
    const res = await request(server).get('/mine');
    expect(res.body.height).toEqual(1);
  });

  it('mines three blocks', async () => {
    const res = await request(server).get('/mine/3');
    const {
      body: { height },
    } = await request(server).get('/');
    expect(res.body.height).toEqual(3);
    expect(height).toEqual(3);
  });

  it('mines one hundred blocks', async () => {
    const res = await request(server).get('/mine/100');
    const {
      body: { height },
    } = await request(server).get('/');
    expect(res.body.height).toEqual(100);
    expect(height).toEqual(100);
  });
});
