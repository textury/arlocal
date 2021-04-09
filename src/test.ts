import Arweave from 'arweave';
import Ardb from 'ardb';

const arweave = Arweave.init({
  host: 'localhost',
  protocol: 'http',
  port: 1984,
  logging: true
});

const ardb = new Ardb(arweave);

(async () => {
  const tx = await createTransaction();
  await getTx(tx);
  await getData(tx);
  await mine();
  await geTransactionWithTag('App-Name', 'Arweave');
})();

async function createTransaction(): Promise<string> {
  const wallet = await arweave.wallets.generate();
  const tx = await arweave.createTransaction({
    data: 'hello world'
  }, wallet);
  tx.addTag('App-Name', 'Arweave');
  tx.addTag('Content-Type', 'text/plain');

  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);

  return tx.id;
}

async function getTx(id: string) {
  const res = await arweave.transactions.get(id);
  console.log(res.id);
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