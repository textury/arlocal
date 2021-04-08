export interface NetworkInterface {
  network: string;
  version: number;
  release: number;
  queue_length: number;
  peers: number;
  height: number;
  current: string;
  blocks: number;
  node_state_latency: number;
}

export class Network {
  readonly network: string = 'arlocal.N.1';
  readonly version: number = 1;
  readonly release: number = 1;
  readonly queue_length: number = 0;
  readonly peers: number = 0;

  height: number = 0;
  current: string = 'Yd57RvI7xESN-T_lHlaZpZhrzUiWp0_7UHPXXaZH8Absnu_1VKW5bp1gXaIKqiSr';
  private _blocks: number = 0;
  node_state_latency: number = 0;

  get blocks(): number {
    return this._blocks;
  }

  toJSON(): NetworkInterface {
    return { 
      network: this.network,
      version: this.version,
      release: this.release,
      queue_length: this.queue_length,
      peers: this.peers,
      height: this.height,
      current: this.current,
      blocks: this.blocks,
      node_state_latency: this.node_state_latency,
    };
  }
}