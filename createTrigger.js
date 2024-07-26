const {AutomanClient, signPayload} = require("@aperture_finance/uniswap-v3-automation-sdk")
const {Wallet} = require("ethers")

const {ChainEnum, ChainIdMapperEnum, AutomatedMarketMakerEnum} = require("./apertureEnums.js")
const {getPrivateKeyForWalletCreation} = require("../helper/aws_helper.js")

//const walletSecretNameInSecretsManager = SECRET_KEY_OF_WALLET_PRIVATE_KEY
const walletSecretNameInSecretsManager = process.env.WALLET_NAME_TEST

/**
* @param wallet: ethers.wallet
* @param chain ChainIdMapperEnum; that maps chain name to its ID in Ethereum Ecosystem
* @param amm string;  The Automated Market Maker from Enum AutomatedMarketMakerEnum
* @param nftId: string; ID of the ECR721 NTFs that represent ownership of a position
*/
async function createRebalanceTrigger(wallet, chain, amm, nftId, lowerEnd, upperEnd) {
    const action = {
        type: "Rebalance",
        slippage: 0.0005, // number between 0-1 From aperture: Represents the percentage of acceptable difference between the expected price of an order and the price when the order actually executes. The default value is 0.0005.
        maxGasProportion: 0.01, //max 0.1% can maximum be used to pay Gas Fees. => "Gas-ceiling"
        tickLower: lowerEnd,
        tickUpper: upperEnd
        //isCurrentTickOffset: false
    }
    const condition = {
        type: "Price",
        //frontendType: "RELATIVE_PRICE",
        gte: "3400" //token0's price denominated in token1 is compared against the specified threshold
        //lte?: string | undefined; // only to be set if you want to set a lower range
        //durationSec?: number | undefined;
        //singleToken?: 0 | 1 | undefined; //If singleToken is set, the condition is considered met if the current USD price of the specified token (either token0 or token1) meets the specified threshold; otherwise, 
    }
    const createTriggerPayload = {
        clientType: "API",
        ownerAddr: wallet.address,
        chainId: ChainIdMapperEnum[chain],
        amm: amm,
        nftId: nftId,
        action: action,
        condition: condition,
        expiration: 1727366810//Unix timestamp in seconds when this trigger expires.
        //autocompound: true
    }
    const payloadSignature = await signPayload(createTriggerPayload, wallet)
    const request = {
        payloadSignature: payloadSignature,
        payload: createTriggerPayload
    }
    client = new AutomanClient("https://api.aperture.finance")
    try {
        response = await client.createTrigger(request)
    } catch(error){
        console.log(error.response.data)
      // received error message: "Cannot verify payload signature"
      // @aperture team - how to fix that?
        console.log(error)
    }
    console.log(response)
}
async function testcreateTrigger() {
    let wallet = new Wallet(await getPrivateKeyForWalletCreation(walletSecretNameInSecretsManager))
    await createRebalanceTrigger(wallet,ChainEnum.ARBITRUM_MAINNET_CHAIN, AutomatedMarketMakerEnum.UNISWAP_V3,"3314470",3000, 3600)
}
testcreateTrigger()
