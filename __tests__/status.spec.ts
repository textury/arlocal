import { NetworkInfoInterface } from 'blockweave/dist/faces/lib/network';
import { blockweave } from '../test-setup';

describe('STATUS', () => {
  // Test if the server started successfully
  test('GET /info', async () => {
    const info: NetworkInfoInterface = await blockweave.network.getInfo();

    expect(info).toBeInstanceOf(Object);
    expect(typeof info.network).toBe('string');
    expect(typeof info.version).toBe('number');
    expect(typeof info.release).toBe('number');
    expect(typeof info.height).toBe('number');
    expect(typeof info.current).toBe('string');
    expect(typeof info.blocks).toBe('number');
    expect(typeof info.peers).toBe('number');
    expect(typeof info.queue_length).toBe('number');
    expect(typeof info.node_state_latency).toBe('number');
  });
});
