import { NetworkInterface } from 'faces/network';
import fs from 'fs';
import Nedb from 'nedb';
import { dbPath } from '../index';
import { Utils } from '../utils/utils';

export class NetworkDB {
  // DB should be emptied on every run.
  private readonly dbFile = `${dbPath}/network.db`;
  private db: Nedb;
  private started = false;

  constructor() {
    this.db = new Nedb({ filename: this.dbFile });
  }

  async init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.loadDatabase(async (err) => {
        if (err) {
          return reject(err);
        }

        this.started = true;

        await this.insert({
          network: 'arlocal.N.1',
          version: 1,
          release: 1,
          queue_length: 0,
          peers: 0,
          height: 0,
          current: Utils.randomID(64),
          blocks: 0,
          node_state_latency: 0,
        });

        resolve(true);
      });
    });
  }

  async insert(obj: NetworkInterface): Promise<NetworkInterface> {
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

  async findOne(): Promise<NetworkInterface> {
    if (!this.started) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.db.findOne({}, (err, doc) => {
        if (err) {
          return reject(err);
        }

        resolve(doc);
      });
    });
  }

  async increment(qty: number = 1): Promise<boolean> {
    if (!this.started) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.db.update(
        {},
        {
          $inc: { height: qty, blocks: qty },
          $set: { current: Utils.randomID(64) },
        },
        { multi: true },
        (err, numReplaced) => {
          if (err) {
            return reject(err);
          }
          if (numReplaced) {
            return resolve(true);
          }

          resolve(false);
        },
      );
    });
  }
}
