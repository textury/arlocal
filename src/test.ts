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
  await createTransaction();
  await geTransactionWithTag('App-Name', 'Arweave');
})();

async function createTransaction() {
  const wallet = await arweave.wallets.generate();
  const tx = await arweave.createTransaction({
    data: 'hello world'
  }, wallet);
  tx.addTag('App-Name', 'Arweave');
  tx.addTag('Content-Type', 'text/plain');

  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);
}

async function geTransactionWithTag(name: string, value: string) {
  const res = await ardb.search('transactions').tag(name, [value]).findOne();
  console.log(res);
}