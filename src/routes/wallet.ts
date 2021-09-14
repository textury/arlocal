import Router from 'koa-router';
import { Utils } from './../utils/utils';
import { Wallet, WalletDB } from '../db/wallet';

let walletDB: WalletDB;
export const walletRegex = /[a-z0-9_-]{43}/i;

export async function getBalanceRoute(ctx: Router.RouterContext) {
  try {
    if (!walletDB) {
      walletDB = new WalletDB(ctx.connection);
    }
    const address = ctx.params.address;
    ctx.body = await walletDB.getWalletBalance(address);
  } catch (error) {
    console.error({ error });
  }
}

export async function createWalletRoute(ctx: Router.RouterContext) {
  try {
    if (!walletDB) {
      walletDB = new WalletDB(ctx.connection);
    }
    const wallet = ctx.request.body as unknown as Wallet;
    if (!wallet?.address) wallet.address = Utils.randomID();
    else if (!wallet.address.match(walletRegex)) {
      ctx.status = 422;
      ctx.body = { status: 422, error: 'Address badly formatted' };
      return;
    }

    await walletDB.addWallet(wallet);
    ctx.body = wallet;
  } catch (error) {
    console.error({ error });
  }
}

export async function getLastWalletTxRoute(ctx: Router.RouterContext) {
  try {
    if (!walletDB) {
      walletDB = new WalletDB(ctx.connection);
    }
    const address = ctx.params.address;
    ctx.body = (await walletDB.getLastTx(address))?.id;
  } catch (error) {
    console.error({ error });
  }
}

export async function updateBalanceRoute(ctx: Router.RouterContext) {
  try {
    if (!walletDB) {
      walletDB = new WalletDB(ctx.connection);
    }
    const address = ctx.params.address;
    const body = ctx.request.body as any;

    if (!body?.balance) {
      ctx.status = 422;
      ctx.body = { status: 422, error: 'Balance is required !' };
      return;
    }
    await walletDB.updateBalance(address, body.balance);
    ctx.body = body;
  } catch (error) {
    console.error({ error });
  }
}
