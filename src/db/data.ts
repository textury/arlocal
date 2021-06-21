import fs from 'fs';
import { dbPath } from 'index';
import Nedb from 'nedb';

export class DataDB {
  // DB should be emptied on every run.
  private readonly dbFile = `${dbPath}txs.db`;
  private db: Nedb;
  private started: boolean = false;

  constructor() {
    this.db = new Nedb({ filename: this.dbFile });
  }

  async init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.loadDatabase((err) => {
        if (err) {
          return reject(err);
        }

        this.started = true;
        resolve(true);
      });
    });
  }

  async insert(obj: { txid: string; data: string }): Promise<{ txid: string; data: string }> {
    if (!this.started) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.db.insert(obj, (err, doc) => {
        if (err) {
          return reject(err);
        }

        resolve(doc);
      });
    });
  }

  async findOne(txid: string): Promise<{ txid: string; data: string }> {
    if (!this.started) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.db.findOne({ txid }, (err, doc) => {
        if (err) {
          return reject(err);
        }

        resolve(doc);
      });
    });
  }
}
