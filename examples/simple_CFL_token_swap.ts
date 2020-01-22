import { ERC20TokenContract } from '@0x/contracts-erc20'
import * as qs from 'qs';
import * as fetch from 'node-fetch';

import { SimpleTokenSwapContractContract } from '../generated-wrappers/simple_token_swap_contract';

import { baseUnitAmount, setUpWeb3GanacheAsync } from './utils';
import { migrationAsync } from '../migrations/migration';

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;
const MNEMONIC = process.env.MNEMONIC;


(async () => {
    const { web3Wrapper, provider } = await setUpWeb3GanacheAsync(MNEMONIC, ETHEREUM_RPC_URL);

    const { simpleTokenSwapAddress } = await migrationAsync(provider, web3Wrapper);

    // 1. call 0x api for a quote for one dollar of DAI.
    const buyAmount = baseUnitAmount(1);

    const params = {
        sellToken: 'ETH',
        buyToken: 'DAI',
        buyAmount: buyAmount.toString(),
    }
    const res = await fetch(`https://api.0x.org/swap/v0/quote?${qs.stringify(params)}`);
    const quote = await res.json();

    console.log('Received quote:', quote);

    // 2. send response from 0x api to your smart contract
    const daiContract = new ERC20TokenContract('0x6b175474e89094c44da98b954eedeac495271d0f', provider);

    const userAddresses = await web3Wrapper.getAvailableAddressesAsync();
    const from = userAddresses[0];

    const contract = new SimpleTokenSwapContractContract(simpleTokenSwapAddress, provider);
    try {
        console.log(`contract dai balance before: ${await daiContract.balanceOf(simpleTokenSwapAddress).callAsync()}`);
        const txHash = await contract.liquidityRequiringFunction(quote.data).sendTransactionAsync({
            from,
            value: quote.value,
            gasPrice: quote.gasPrice,
            gas: 300000,
        });
        console.log(`contract dai balance after: ${await daiContract.balanceOf(simpleTokenSwapAddress).callAsync()}`);
    } catch (e) {
        console.log(e)
    }
})()