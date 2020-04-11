import BN from "bn.js";
import { Map } from "immutable";
import { untilTxMined } from "demo-tx";
import { getPassword } from "../util";
import { Demo, EthAddress, BM, SignerEth } from "./types";
import { deployed, mintFunc, cx } from "demo-aztec-lib";
import { RINKEBY_ADMIN_ADDRESS, RINKEBY_ADMIN_PASSWORD } from "./constants";

type doMintOptions = { demo: Demo; bm: BM; tradeSymbol: string; amount: BN };
export const doMint = async ({
  demo,
  bm,
  tradeSymbol,
  amount,
}: doMintOptions): Promise<void> => {
  console.info("Beginning Mint Process:");
  const { signerEth } = await demo.keys.wallet.prepareSignerEth({
    address: RINKEBY_ADMIN_ADDRESS,
    password: RINKEBY_ADMIN_PASSWORD,
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
    minedTx: minedTxFunc({ demo, fromAddress: RINKEBY_ADMIN_ADDRESS }),
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
      contractName,
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
type doCXProps = {
  recipient: any;
  tradeSymbol: string;
  amount: number;
  noteHash: any;
};

export const doCX = (demo: Demo) => async ({
  recipient,
  tradeSymbol,
  amount,
  noteHash,
}: doCXProps) => {
  console.log("recipient", recipient.toJS());
  console.info({ tradeSymbol, amount, noteHash });

  const thisPassword = getPassword(demo.chainId);
  const minedTx = minedTxFunc({ demo, fromAddress: demo.thisAddress });

  if (!thisPassword)
    throw Error("Transfer Failed: No password given for chain " + demo.chainId);

  const argMap = Map({
    tradeSymbol,
    bm: demo.bm,
    chainId: demo.chainId,
    signerEth: demo.thisSignerEth,
    deployed: deployedFunc({ bm: demo.bm, signerEth: demo.thisSignerEth }),
    minedTx: minedTxFunc({ demo, fromAddress: demo.thisAddress }),
    deployerAddress: demo.thisAddress,
    deployerPassword: thisPassword,
    senderAddress: demo.thisAddress,
    senderPublicKey: demo.thisPublicKey,
    senderPassword: thisPassword,
    senderNoteHash: noteHash,
    receiverAddress: recipient.get("address"),
    receiverPublicKey: recipient.get("publicKey"),
    transfererAddress: demo.thisAddress,
    transferFunc: async (token: any, proofData: any, signatures: any) => {
      return await minedTx(
        token.confidentialTransfer,
        [proofData, signatures],
        {}
      );
    },
    transferAmount: new BN(amount),
    wallet: demo.keys.wallet,
  });

  return await cx(argMap);
};
