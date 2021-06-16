# arlocal
Run a local Arweave gateway-like server.

## Usage
#### Init
Make sure you already have NodeJS + NPM installed.
To run `arlocal` it's as simple as doing an `npx` which means running the latest version available on `npmjs.com`.
```
npx @textury/arlocal
```
That's it! You are running a local slim gateway on `http://localhost:1984`

How about if I want to run it on another port?!
It's as simple as doing:
```
npx @textury/arlocal 8080
```
This will start arlocal on port `8080`.

#### Sending transactions
Sending a new transaction is done just like with the default gateway, use ArweaveJS to create your transaction, sign and post it.

After this transaction is sent, to confirm (`mine`) your transactions, you need to hit the `/mine` endpoint. You can do this programmatically or by simply going to `http://localhost:1984/mine`.

You can also mine more than one block at a time by hitting `/mine/{blocks}`, this will increase the current blocks to the set `blocks`.

## Features
- Extremely fast compared to other options out there.
- Community built, open source and free.
- No need of external resources, only NodeJS + NPM.
- Test transactions, SmartWeave contracts, GraphQL requests, NFT deployment and more.
- Works on Windows, Mac, Linux, Raspberry Pi, and pretty much everywhere as long as NodeJS is installed.

### TODO
- Balances management, allow to create new wallets, set their balances and handle balances (fees, transfer, deposit, etc).
- Multiple paths are still missing, please refer to the `routes` folder to see the list of the currently available routes.

### Contributing
PRs are greatly appreciated, help us build this hugely needed tool so anyone else can easily test their own transactions and SmartWeave contracts.

Before doing a PR, remember that if this is a route or an extisting feature of the gateway, you need to respect the same path/default of the existing mainnet gateway. Example: `/tx` should be kept as `/tx`, this is so the user doesn't have to do many changes for their unit tests, compared to normal transaction on mainnet.

1.  Create a fork
2.  Create your feature branch: `git checkout -b my-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request 🚀