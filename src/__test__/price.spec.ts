import request from 'supertest';
import { basePrice, server } from '../../test-setup';

describe('PRICE ENDPOINT', () => {
  it('returns the correct price without addy', async () => {
    const res = await request(server).get('/price/20');
    expect(+res.text).toEqual(20 * basePrice);
  });

  it('returns the correct price with addy', async () => {
    const res = await request(server).get('/price/10/2');
    expect(+res.text).toEqual(10 * basePrice);
  });
});
