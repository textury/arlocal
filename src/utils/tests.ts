import Arweave from 'arweave/node/common';

export async function createTransaction(arweave: Arweave, data: any = 'hello world'): Promise<string> {
  const wallet = await arweave.wallets.generate();
  const tx = await arweave.createTransaction(
    {
      data,
    },
    wallet,
  );
  tx.addTag('App-Name', 'Arweave');
  tx.addTag('Content-Type', 'text/plain');

  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);

  return tx.id;
}

export async function getTx(arweave: Arweave, id: string) {
  try {
    const res = await arweave.transactions.get(id);
    return res;
  } catch (e) {
    console.log(`${id} - not found.`);
  }
}
