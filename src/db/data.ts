import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

export class DataDB {
  // DB should be emptied on every run.
  private path: string;
  private started: boolean = false;

  constructor(dbPath: string) {
    this.path = join(dbPath, 'data-');
  }

  async insert(obj: { txid: string; data: string }): Promise<{ txid: string; data: string }> {
    writeFileSync(this.path + obj.txid, typeof obj.data === 'string' ? obj.data : JSON.stringify(obj.data), 'utf8');
    return obj;
  }

  async findOne(txid: string): Promise<{ txid: string; data: string }> {
    const data = readFileSync(this.path + txid, 'utf8');
    return { txid, data };
  }
}
