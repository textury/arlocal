import request from 'supertest';
import { server } from '../test-setup';

describe('txAnchor ENDPOINT', () => {
  it('Should be empty when no tx', async () => {
    const res = await request(server).get('/tx_anchor');
    expect(res.text).toHaveLength(0);
  });
});
