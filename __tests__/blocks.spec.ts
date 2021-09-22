import { blockweave } from '../test-setup';
import { mine } from '../src/utils/tests';

describe('BLOCK', () => {
  it('GET /block/hash/:indep_hash', async () => {
    await mine(blockweave);
    const { current: block } = await blockweave.network.getInfo();
    const b = await blockweave.blocks.get(block);
    expect(b.indep_hash).toBe(block);
  });
});
