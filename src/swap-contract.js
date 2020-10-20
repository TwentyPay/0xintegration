'use strict'
require('colors');
const fetch = require('node-fetch');
const process = require('process');
const { createWeb3, createQueryString, etherToWei, waitForTxSuccess, weiToEther } = require('./utils');

const API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
// Need to hardcode this abi file in the frontend after contract changes
const { abi: ABI } = require('./abi.json');
const newArgs = {
    deployedAddress: '0x7382949f535C1bb4D64059b934d4A63A11D3DAa2',
    sellAmount: '0.1'
}

const awaitRun = async newArgs => {
    try {
        await run(newArgs);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

awaitRun(newArgs)

async function run(newArgs) {
    const web3 = createWeb3();
    const contract = new web3.eth.Contract(ABI, newArgs.deployedAddress);
    const [owner] = await web3.eth.getAccounts();

    // Convert sellAmount from token units to wei.
    const sellAmountWei = etherToWei(newArgs.sellAmount);

    // Deposit some WETH into the contract. This function accepts ETH and
    // wraps it to WETH on the fly.
    console.info(`Depositing ${newArgs.sellAmount} ETH (WETH) into the contract at ${newArgs.deployedAddress.bold}...`);
    await waitForTxSuccess(contract.methods.depositETH().send({
        value: sellAmountWei,
        from: owner,
    }));

    // Get a quote from 0x-API to sell the WETH we just deposited into the contract.
    console.info(`Fetching swap quote from 0x-API to sell ${newArgs.sellAmount} WETH for DAI...`);
    const qs = createQueryString({
        sellToken: 'WETH',
        buyToken: 'DAI',
        sellAmount: sellAmountWei,
    });
    const quoteUrl = `${API_QUOTE_URL}?${qs}`;
    console.info(`Fetching quote ${quoteUrl.bold}...`);
    const response = await fetch(quoteUrl);
    const quote = await response.json();
    console.info(`Received a quote with price ${quote.price}`);

    // Have the contract fill the quote, selling its own WETH.
    console.info(`Filling the quote through the contract at ${newArgs.deployedAddress.bold}...`);
    const receipt = await waitForTxSuccess(contract.methods.fillQuote(
            quote.sellTokenAddress,
            quote.buyTokenAddress,
            quote.allowanceTarget,
            quote.to,
            quote.data,
        ).send({
            from: owner,
            value: quote.value,
            gasPrice: quote.gasPrice,
        }));
    const boughtAmount = weiToEther(receipt.events.BoughtTokens.returnValues.boughtAmount);
    console.info(`${'✔'.bold.green} Successfully sold ${newArgs.sellAmount.toString().bold} WETH for ${boughtAmount.bold.green} DAI!`);
    // The contract now has `boughtAmount` of DAI!
}
