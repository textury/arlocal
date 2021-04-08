import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'localhost',
  protocol: 'http',
  port: 1984,
  logging: true
});

(async () => {
  const wallet = await arweave.wallets.generate();
  const tx = await arweave.createTransaction({
    data: 'hello world'
  }, wallet);
  tx.addTag('App-Name', 'Arweave');

  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);
})();