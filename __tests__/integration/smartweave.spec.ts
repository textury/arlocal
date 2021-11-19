import request from 'supertest';
import Blockweave from 'blockweave';
import { JWKInterface } from 'blockweave/dist/faces/lib/wallet';

import { readFileSync } from 'fs';
import { join } from 'path';
import { interactWrite, readContract } from 'smartweave';
import ArLocal from '../../src/app';
import { mine } from '../../src/utils/tests';

let bw: Blockweave;
let arlocal: ArLocal;
let contractSource: string;
let initialState: string;
let initStateTxId: string;

let wallet: JWKInterface;

/**
 * This integration test should verify whether the basic functions of the SmartWeave client
 * work properly.
 * It first deploys the new contract and verifies its initial state.
 * Then it subsequently creates new interactions - to verify, whether
 * the default caching mechanism (ie. interactions cache, state cache, etc).
 * work properly (ie. they do download the not yet cached interactions and evaluate state
 * for them).
 */
describe('Testing the SmartWeave client', () => {
  beforeAll(async () => {
    // note: each tests suit (i.e. file with tests that Jest is running concurrently
    // with another files has to have ArLocal set to a different port!)
    arlocal = new ArLocal(4001, false, `${process.cwd()}/databse`);
    await arlocal.start();

    bw = new Blockweave({
      host: 'localhost',
      port: 4001,
      protocol: 'http',
    });
    wallet = await bw.wallets.generate();
    const address = await bw.wallets.getAddress(wallet);
    await request(arlocal.getServer()).get(`/mint/${address}/100000000000000000000`);

    contractSource = readFileSync(join(__dirname, 'data/example-contract.js'), 'utf8');
    initialState = readFileSync(join(__dirname, 'data/example-contract-state.json'), 'utf8');
    const { initialStateTxId } = await createContract();
    initStateTxId = initialStateTxId;

    await mine(bw);
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  it('should properly deploy contract with initial state', async () => {
    expect((await getLatestState()).counter).toEqual(555);
  });

  it('should properly add new interaction', async () => {
    await add();

    await mine(bw);

    expect((await getLatestState()).counter).toEqual(556);
  });

  it('should properly add another interactions', async () => {
    await add();
    await add();
    await add();
    await mine(bw);

    expect((await getLatestState()).counter).toEqual(559);
  });

  it('should properly add another interaction with a payload', async () => {
    await add(2);
    await mine(bw);

    expect((await getLatestState()).counter).toEqual(561);
  });

  it('should properly view contract state', async () => {
    const interactionResult = await (await getLatestState()).counter;
    expect(interactionResult).toEqual(561);
  });

  it('should properly subtract another interactions', async () => {
    let i = 6;
    while (i--) await subtract();

    await mine(bw);

    expect((await getLatestState()).counter).toEqual(555);
  });

  it('should properly get block Height', async () => {
    await blockHeight();
    await mine(bw);
    expect((await getLatestState()).blockHeight).toEqual(arlocal.getNetwork().height);
  });
});

// utils

async function createContract() {
  // Let's first create the contract transaction.
  const contractTx = await bw.createTransaction({ data: contractSource }, wallet);
  contractTx.addTag('App-Name', 'SmartWeaveContractSource');
  contractTx.addTag('App-Version', '0.3.0');
  contractTx.addTag('Content-Type', 'application/javascript');

  // Sign
  await bw.transactions.sign(contractTx, wallet);
  // Let's keep the ID, it will be used in the state transaction.
  const contractSourceTxId = contractTx.id;

  // Deploy the contract source
  await bw.transactions.post(contractTx);

  // Now, let's create the Initial State transaction
  const initialStateTx = await bw.createTransaction({ data: initialState }, wallet);
  initialStateTx.addTag('App-Name', 'SmartWeaveContract');
  initialStateTx.addTag('App-Version', '0.3.0');
  initialStateTx.addTag('Contract-Src', contractSourceTxId);
  initialStateTx.addTag('Content-Type', 'application/json');

  // Sign
  await bw.transactions.sign(initialStateTx, wallet);
  const initialStateTxId = initialStateTx.id;
  // Deploy
  await bw.transactions.post(initialStateTx);
  return { contractSourceTxId, initialStateTxId };
}

async function getLatestState() {
  // @ts-ignore
  const latestState = await readContract(bw, initStateTxId);
  return latestState;
}

async function add(payload = 1) {
  const input = {
    function: 'add',
    payload,
  };

  //@ts-ignore
  await interactWrite(bw, wallet, initStateTxId, input);
}

async function subtract() {
  const input = {
    function: 'subtract',
  };

  //@ts-ignore
  await interactWrite(bw, wallet, initStateTxId, input);
}

async function blockHeight() {
  const input = {
    function: 'blockHeight',
  };

  //@ts-ignore
  await interactWrite(bw, wallet, initStateTxId, input);
}
