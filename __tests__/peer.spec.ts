import request from 'supertest';
import { server } from '../src/test-setup';
test('GET /peers', async () => {
  const res = await request(server).get('/peers');

  // check if it's array
  expect(res.body instanceof Array).toBe(true);
  expect(res.body.length).toBeGreaterThanOrEqual(1);
});
