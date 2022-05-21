import request from 'supertest';
import { server } from '../src/test-setup';

describe('txAnchor ENDPOINT', () => {
  it('Should be equal current block', async () => {
    const res = await request(server).get('/tx_anchor');
    const res2 = await request(server).get('/info');
    expect(res.text).toEqual(res2.body.current);
  });
});
