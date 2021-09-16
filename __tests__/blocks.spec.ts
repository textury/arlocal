import { blockweave } from '../test-setup';

describe('BLOCK', () => {
  it('GET /block/hash/:indep_hash', async () => {
    // const block = await blockweave.blocks.getCurrent();
    const { current: block } = await blockweave.network.getInfo();

    const indepHash = await blockweave.blocks.get(block);
    expect(indepHash).toBe(block);
  });
});
