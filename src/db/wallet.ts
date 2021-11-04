import { TransactionType } from 'faces/transaction';
import { Knex } from 'knex';
import { Utils } from '../utils/utils';
export interface Wallet {
  address: string;
  balance: number;
}

export class WalletDB {
  private connection: Knex;

  constructor(connection: Knex) {
    this.connection = connection;
  }

  async addWallet(wallet: Wallet) {
    return await this.connection
      .insert({
        id: Utils.randomID(64),
        address: wallet.address,
        balance: wallet.balance,
      })
      .into('wallets');
  }

  async getWallet(address: string): Promise<Wallet> {
    return (
      await this.connection.queryBuilder().select('*').from('wallets').where('address', '=', address).limit(1)
    )[0];
  }

  async getWalletBalance(address: string): Promise<number> {
    const wallet = await this.getWallet(address);
    if(!wallet) return 0
    return wallet.balance;
  }

  async getLastTx(address: string): Promise<TransactionType> {
    return (
      await this.connection
        .queryBuilder()
        .select('*')
        .from('transactions')
        .where('owner', '=', address)
        .orderBy('created_at', 'desc')
        .limit(1)
    )[0];
  }

  async updateBalance(address: string, balance: number) {
    return await this.connection('wallets').update({ balance }).where({ address });
  }
  async incrementBalance(address: string, balance: number) {
    try {
      return await this.connection('wallets').increment('balance', balance).where({ address });
    } catch (error) {
      console.log({ error });
    }
  }
}
