#!/usr/bin/env node
import minimist from 'minimist';
import ArLocal from './app';
import { appData } from './utils/appdata';

const argv = minimist(process.argv.slice(2));

const port = argv._.length && !isNaN(+argv._[0]) ? argv._[0] : 1984;
const showLogs = argv.hidelogs ? false : true;

const folder = appData('arlocal', '.db');
const dbPath = folder;

let app: ArLocal;

(async () => {
  app = new ArLocal(+port, showLogs, dbPath);
  await app.start();

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();

async function stop() {
  try {
    await app.stop();
  } catch (e) {}
}
