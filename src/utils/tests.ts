import Blockweave from 'blockweave';

export async function createTransaction(blockWeave: Blockweave, data: any = 'hello world'): Promise<string> {
  const wallet = await blockWeave.wallets.generate();
  const tx = await blockWeave.createTransaction(
    {
      data,
    },
    wallet,
  );
  tx.addTag('App-Name', 'blockWeave');
  tx.addTag('Content-Type', 'text/plain');

  await blockWeave.transactions.sign(tx, wallet);
  await blockWeave.transactions.post(tx);

  return tx.id;
}
export async function mine(blockweave: Blockweave) {
  await blockweave.api.get('mine');
}
