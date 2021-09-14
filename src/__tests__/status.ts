import Arlocal from '../app';
import Blockweave from 'blockweave';
import { NetworkInfoInterface } from 'blockweave/dist/faces/lib/network';

describe('STATUS', () => {
  let blockweave: Blockweave;
  const arlocal: Arlocal = new Arlocal();

  jest.setTimeout(20000);
  beforeAll(async () => {
    await arlocal.start();
    blockweave = new Blockweave({
      host: '127.0.0.1',
      port: '1984',
      protocol: 'http',
      timeout: 20000,
      logging: false,
    }); 
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  // Test if the server started successfully 
  test('Network info', async () => {
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
  })
});
