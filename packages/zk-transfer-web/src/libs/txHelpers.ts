import BN from "bn.js";
import { Map } from "immutable";
import { Demo, EthAddress, BM, SignerEth } from "./types";
import { untilTxMined } from "demo-tx";
import { deployed, mintFunc } from "demo-aztec-lib";
import { RINKEBY_ADMIN_ADDRESS, RINKEBY_ADMIN_PASSWORD } from "./constants";

type doMintOptions = { demo: Demo; bm: BM; tradeSymbol: string; amount: BN };
export const doMint = async ({
  demo,
  bm,
  tradeSymbol,
  amount
}: doMintOptions): Promise<void> => {
  console.info("Beginning Mint Process:");
  console.info("Mint Function", deployed);
  const { signerEth } = await demo.keys.wallet.prepareSignerEth({
    address: RINKEBY_ADMIN_ADDRESS,
    password: RINKEBY_ADMIN_PASSWORD
  });

  const params = Map({
    bm,
    tradeSymbol,
    mintFromZero: false,
    chainId: demo.chainId,
    deployerEth: signerEth,
    minteeAmount: amount,
    minteeAddress: demo.thisAddress,
    minteePublicKey: demo.thisPublicKey,
    deployerAddress: RINKEBY_ADMIN_ADDRESS,
    deployerPassword: RINKEBY_ADMIN_PASSWORD,
    deployed: deployedFunc({ bm, signerEth }),
    minedTx: minedTxFunc({ demo, fromAddress: RINKEBY_ADMIN_ADDRESS })
  });

  await mintFunc(params.toJS());
};

type deployFuncProp = {
  bm: BM;
  signerEth: SignerEth;
};

const deployedFunc = ({ bm, signerEth }: deployFuncProp) => {
  return async (contractName: string, options: { deployId: string }) => {
    return await deployed({
      bm,
      options,
      signerEth,
      contractName
    });
  };
};

type minedTxProps = {
  demo: Demo;
  fromAddress: EthAddress;
};

const minedTxFunc = ({ demo, fromAddress }: minedTxProps) => {
  // NOTE: We rely on `deployed` being called above to prepare the
  // associated signer.
  return async (method: any, argList: any, options: any): Promise<any> => {
    const signerEth = demo.keys.wallet.signersMap[fromAddress];
    const _options = Map({ from: fromAddress, gas: demo.config["GAS_LIMIT"] })
      .merge(options)
      .toJS();
    const txHash = await method(...argList, _options);

    console.groupCollapsed("Mined TX Function");
    console.info("MinedTx from address:", fromAddress);
    console.info("deployerEth.address:", JSON.stringify(_options));
    console.groupEnd();

    return untilTxMined({ txHash, eth: signerEth });
  };
};
