import { blockweave } from '../test-setup';

describe('BLOCK', () => {
  it('GET /block/hash/:indep_hash', async () => {
    await mine();
    const { current: block } = await blockweave.network.getInfo();
    const b = await blockweave.blocks.get(block);
    expect(b.indep_hash).toBe(block);
  });
});

async function mine() {
  await blockweave.api.get('mine');
}