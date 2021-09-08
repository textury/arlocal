import { app, ardk } from '../../test-setup';
describe('STATUS ENDPOINT', () => {
  let res;
  it('gets current', async () => {
    res = await ardk.network.getInfo();
    expect(app.context.network.current).toEqual(res.current);
  });

  it('gets network', async () => {
    expect(app.context.network.network).toEqual(res.network);
  });

  it('gets version', async () => {
    expect(app.context.network.version).toEqual(res.version);
  });

  it('gets release', async () => {
    expect(app.context.network.release).toEqual(res.release);
  });

  it('gets queue_length', async () => {
    expect(app.context.network.queue_length).toEqual(res.queue_length);
  });

  it('gets peers', async () => {
    expect(app.context.network.peers).toEqual(res.peers);
  });

  it('gets height', async () => {
    expect(app.context.network.height).toEqual(res.height);
  });

  it('gets blocks', async () => {
    expect(app.context.network.blocks).toEqual(res.blocks);
  });

  it('gets node_state_latency', async () => {
    expect(app.context.network.node_state_latency).toEqual(res.node_state_latency);
  });
});
