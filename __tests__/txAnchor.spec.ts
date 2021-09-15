import request from 'supertest';
import { server } from '../test-setup';

describe('txAnchor ENDPOINT', () => {
  it('returns an ID when no transaction is found', async () => {
    const res = await request(server).get('/tx_anchor');
    expect(res.text).toHaveLength(43);
  });
});
