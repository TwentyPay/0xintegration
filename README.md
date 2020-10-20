![alt text](/banner.png "Get started with 0x API")

# Get started with 0x API

This is a repo containing toy examples of filling 0x-API quotes either directly with web3 or through a smart contract.

## Installation
Clone this repo then, from inside the project, run:
```bash
yarn -D
# or
npm install --dev
```

This will also compile the contracts in `contracts/` and produce artifacts in `build/`.|

### Running the examples locally (forked mainnet)
The examples can be run locally (without actually mining transactions) through the magic of ganache forking. You will first need to start a forked ganache instance with the following command, replacing `ETHEREUM_RPC_URL` with the HTTP or websocket RPC URL of your mainnet ethereum node (e.g., Infura mainnet): (Do this in the project folder)

```bash
RPC_URL=ETHEREUM_RPC_URL npm run start-fork
```

#### Contract swap
To get the contract swap ready, in a separate terminal (but also in your project folder) run:
```bash
npm run deploy-fork # Only need to do this once per ganache instance.
```
