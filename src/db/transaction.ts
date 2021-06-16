import { pick } from 'lodash';
import { DataItemJson } from 'arweave-bundles';
import { TransactionType } from '../faces/transaction';
import { Utils } from '../utils/utils';
import { fromB64Url, sha256B64Url } from '../utils/encoding';
import { indices } from '../utils/order';
import { connection } from './connection';
import { DataDB } from './data';

export interface ANSTransaction {
  id: string;
  owner: string;
  content_type: string;
  target: string;
  tags: string;
}

export interface DatabaseTag {
  tx_id: string;
  index: number;
  name: string | undefined;
  value: string | undefined;
}

export const transactionFields = [
  'format',
  'id',
  'signature',
  'owner',
  'owner_address',
  'target',
  'reward',
  'last_tx',
  'height',
  'tags',
  'quantity',
  'content_type',
  'data_size',
  'data_root',
];

export function formatTransaction(transaction: TransactionType) {
  const indexFields: any = {};

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    const value = Utils.tagValue(transaction.tags, index);

    if (value) {
      indexFields[index] = value;
    }
  }

  return pick(
    {
      ...transaction,
      ...indexFields,
      content_type: Utils.tagValue(transaction.tags, 'content-type'),
      format: transaction.format || 0,
      data_size: transaction.data_size || transaction.data ? fromB64Url(transaction.data).byteLength : undefined,
      tags: JSON.stringify(transaction.tags),
      owner_address: sha256B64Url(fromB64Url(transaction.owner)),
    },
    transactionFields.concat(indices),
  );
}

export function formatAnsTransaction(ansTransaction: DataItemJson) {
  const indexFields: any = {};

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    const value = Utils.tagValue(ansTransaction.tags, index);

    if (value) {
      indexFields[index] = value;
    }
  }

  return pick(
    {
      ...indexFields,
      id: ansTransaction.id,
      owner: ansTransaction.owner,
      content_type: 'ANS-102',
      target: ansTransaction.target,
      tags: JSON.stringify(ansTransaction.tags),
    },
    transactionFields.concat(indices),
  );
}

export class TransactionDB {
  private dataDB: DataDB;

  constructor() {
    this.dataDB = new DataDB();
  }

  async getById(txId: string) {
    const tx = (await connection.queryBuilder().select('*').from('transactions').where('id', '=', txId).limit(1))[0];
    tx.tags = JSON.parse(tx.tags);

    return tx;
  }
}
