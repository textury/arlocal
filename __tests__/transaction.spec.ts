import request from 'supertest';
import { createData, bundleAndSignData, signers } from 'arbundles';
import { blockweave, server, wallet } from '../src/test-setup';
import { createTransaction, mine } from '../src/utils/tests';

jest.setTimeout(20000);

describe('', () => {
  describe('TX', () => {
    it('Create and GET a TX metadata', async () => {
      const txid = await createTransaction(blockweave, 'test');

      expect(txid).toBeDefined();
      // Call the endpoint directly
      const res = await request(server).get(`/tx/${txid}`);

      expect(res.body.id).toEqual(txid);
    });
  });

  describe('TX STATUS', () => {
    it('returns "NOT MINED"', async () => {
      const txid = await createTransaction(blockweave, 'test');

      const res = await request(server).get(`/tx/${txid}/status`);

      expect(res.text).toEqual('Pending');
    });

    it('returns the height of the block', async () => {
      const txid = await createTransaction(blockweave, 'test');
      await mine(blockweave);
      const status = await blockweave.transactions.getStatus(txid);

      expect(status.confirmed.block_height).toEqual(1);
    });

    it('returns the hash of his block', async () => {
      const txid = await createTransaction(blockweave, 'test');
      await mine(blockweave);
      const status = await blockweave.transactions.getStatus(txid);
      // const lastBlock = await blockweave.network.getInfo(); // caching cause an issue
      const { body: lastBlock } = await request(server).get('/');
      expect(status.confirmed.block_indep_hash).toEqual(lastBlock.current);
    });

    it('returns the number of confirmation', async () => {
      const txid = await createTransaction(blockweave, 'test');
      await mine(blockweave);
      await mine(blockweave);
      await mine(blockweave);
      const status = await blockweave.transactions.getStatus(txid);
      expect(status.confirmed.number_of_confirmations).toEqual(2);
    });
  });

  describe('TX FIELD', () => {
    it('returns the id field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      await mine(blockweave);
      const { text: id } = await request(server).get(`/tx/${txid}/id`);
      expect(id).toEqual(txid);
    });

    it('returns the last_tx field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: lastTx } = await request(server).get(`/tx/${txid}/last_tx`);
      expect(lastTx).toEqual(tx.last_tx);
    });

    it('returns the owner field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: owner } = await request(server).get(`/tx/${txid}/owner`);
      expect(owner).toEqual(tx.owner);
    });

    it('returns the tags field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: tags } = await request(server).get(`/tx/${txid}/tags`);
      expect(JSON.parse(tags).length).toEqual(tx.tags.length);
    });

    it('returns the target field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: target } = await request(server).get(`/tx/${txid}/target`);
      expect(target).toEqual(tx.target);
    });

    it('returns the quantity field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: quantity } = await request(server).get(`/tx/${txid}/quantity`);
      expect(quantity).toEqual(tx.quantity);
    });

    it('returns the data_root field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: dataRoot } = await request(server).get(`/tx/${txid}/data_root`);
      expect(dataRoot).toEqual(tx.data_root);
    });

    it('returns the data_size field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: dataSize } = await request(server).get(`/tx/${txid}/data_size`);
      expect(+dataSize).toEqual(tx.data_size);
    });

    it('returns the reward field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: reward } = await request(server).get(`/tx/${txid}/reward`);
      expect(reward).toEqual(tx.reward);
    });

    it('returns the signature field', async () => {
      const txid = await createTransaction(blockweave, 'test');
      const tx = await blockweave.transactions.get(txid);
      await mine(blockweave);
      const { text: signature } = await request(server).get(`/tx/${txid}/signature`);
      expect(signature).toEqual(tx.signature);
    });

    it("returns Pending when tx isn't mined yet", async () => {
      const txid = await createTransaction(blockweave, 'test');
      const { text } = await request(server).get(`/tx/${txid}/signature`);
      expect(text).toEqual('Pending');
    });
  });

  describe('Delete TX', () => {
    it('Delete TX', async () => {
      const txid = await createTransaction(blockweave, 'test');

      expect(txid).toBeDefined();
      // Call the endpoint directly
      let res = await request(server).get(`/tx/${txid}`);

      expect(res.body.id).toEqual(txid);
      await request(server).delete(`/tx/${txid}`);
      res = await request(server).get(`/tx/${txid}`);
      expect(res.status).toEqual(404);
    });
  });

  it('GET /tx/:txid/data', async () => {
    const txid = await createTransaction(blockweave, 'test');
    const data = 'dGVzdA';
    const res = await request(server).get(`/tx/${txid}/data`);

    expect(data).toEqual(res.text);
  });

  describe('Bundled TX data-items', () => {
    it('should return "not found"', async () => {
      const signer = new signers.ArweaveSigner(wallet);

      const dataItems = [createData("hello", signer), createData("world", signer)];
      const bundle = await bundleAndSignData(dataItems, signer);
      const tx = await bundle.toTransaction({}, blockweave as any, wallet);
      // get the zero item
      const txid = bundle.getIdBy(0);
      
      await blockweave.transactions.sign(tx as any, wallet);
      await blockweave.transactions.post(tx);

      await mine(blockweave);

      // EXPECT DATA-ITEM TO RETURN 404
      // call all tx endpoints
      let res = await request(server).get(`/tx/${txid}`);
      expect(res.statusCode).toEqual(404);
      expect(res.text).toEqual('Not Found');

      res = await request(server).get(`/tx/${txid}/data`);
      expect(res.statusCode).toEqual(404);
      expect(res.text).toEqual('Not Found');

      res = await request(server).get(`/tx/${txid}/data.json`);
      expect(res.statusCode).toEqual(404);
      expect(res.text).toEqual('Not Found');

      res = await request(server).get(`/tx/${txid}/offset`);
      expect(res.statusCode).toEqual(404);
      expect(res.text).toEqual('Not Found');
    });
  })
});
