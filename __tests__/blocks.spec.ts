import { blockweave } from '../test-setup';

describe('BLOCK', () => {
  it('GET /block/hash/:indep_hash', async () => {
    await blockweave.api.get('mine');
    const { current: block } = await blockweave.network.getInfo();

    const { indep_hash: indepHash } = await blockweave.blocks.get(block);
    expect(indepHash).toBe(block);
  });
});
