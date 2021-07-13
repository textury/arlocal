import Arweave from 'arweave';
import Ardb from 'ardb';
import ArLocal from './app';

const arweave = Arweave.init({
  host: 'localhost',
  protocol: 'http',
  port: 1984,
  logging: true,
});

const ardb = new Ardb(arweave);

(async () => {
  const arLocal = new ArLocal();
  await arLocal.start();

  let i = 10;
  while(i--) {
    let tx = await createTransaction();
    await getTx(tx);
    await getData(tx);
    await mine();
    await geTransactionWithTag('App-Name', 'Arweave');
  }

  await getTx('7U1g-kxNP0HQj7hjQEePABG7lpNKpUMf32yBfHTETD0'); // invalid tx

  await arLocal.stop();
})();

async function createTransaction(): Promise<string> {
  const wallet = await arweave.wallets.generate();
  const tx = await arweave.createTransaction(
    {
      data: 'hello world',
    },
    wallet,
  );
  tx.addTag('App-Name', 'Arweave');
  tx.addTag('Content-Type', 'text/plain');

  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);

  return tx.id;
}

async function getTx(id: string) {
  try {
    const res = await arweave.transactions.get(id);
    console.log(res.id);
  } catch (e) {
    console.log(`${id} - not found.`);
  }
}

async function getData(id: string) {
  const res = await arweave.api.get(id);
  console.log(res.data);
}

async function geTransactionWithTag(name: string, value: string) {
  const res = await ardb.search('transactions').tag(name, [value]).findOne();
  console.log(res);
}

async function mine() {
  await arweave.api.get('mine');
}
