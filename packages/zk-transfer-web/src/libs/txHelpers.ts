import BN from "bn.js";
import { Map } from "immutable";
// import { getPassword } from "../util";
import { untilTxMined } from "demo-tx";
import { runTransforms } from "demo-transform";
import { Demo, AddressPasswordHash } from "./types";
import { deployed, constructMintPipeline } from "demo-aztec-lib";
// const { deployed, constructMintPipeline } = require(‘demo-aztec-lib’)

const mintPipeline = constructMintPipeline();

export const mint = async (state: any) => {
  return await runTransforms(mintPipeline, state);
};

// export const getSignerEth = (demo: Demo) => ({
//   address,
//   password
// }: AddressPasswordHash) => {
//   return new Promise((resolve, reject) => {
//     demo.keys.wallet
//       .prepareSignerEth({ address, password })
//       .then(val => {
//         console.log("signerEth for address password", val);
//         resolve(val);
//       })
//       .catch(err => reject(err));
//   });
// };

const RINKEBY_ADMIN_ADDRESS = "0x6f38461e067426e5858aBD2610C22bCb35128Bf5";
const RINKEBY_ADMIN_PASSWORD =
  "652c22d2630960a3825d9bc92354c82ea76f895d62f2ca160223db48c5e69f26";

//   getAztecPublicKey({ address: demo.thisAddress, wallet: demo.keys.wallet });
export const makeMint = (demo: Demo) => async ({
  bm,
  tradeSymbol,
  amount
}: any): Promise<void> => {
  console.log("trying to mint money");
  // const makeSignerEth = getSignerEth(demo);
  const deployerEth: any = await demo.keys.wallet.prepareSignerEth({
    address: RINKEBY_ADMIN_ADDRESS,
    password: RINKEBY_ADMIN_PASSWORD
  });

  const params = Map({
    bm,
    chainId: demo.chainId,
    deployerEth: deployerEth,
    deployed: deployedFunc({ bm, signerEth: deployerEth.signerEth }),
    minedTx: minedTxFunc({ wallet: demo.keys.wallet, RINKEBY_ADMIN_ADDRESS }),
    deployerAddress: RINKEBY_ADMIN_ADDRESS, //demo.thisAddress, // users address
    deployerPassword: RINKEBY_ADMIN_PASSWORD, // getPassword(demo.chainId), // users password
    tradeSymbol,
    minteeAddress: demo.thisAddress,
    minteePublicKey: demo.thisPublicKey,
    minteeAmount: new BN(amount),
    mintFromZero: false
  });
  console.log(params.toJS());

  await mint(params);
};

const deployedFunc = ({ bm, signerEth }: any) => async (
  contractName: any,
  options: any
) => {
  return await deployed({
    contractName,
    options,
    bm,
    signerEth
  });
};

const minedTxFunc = ({ wallet, fromAddress }: any) => async (
  method: any,
  argList: any,
  options: any
): Promise<any> => {
  console.groupCollapsed("Mined TX Function");
  const _options = Map({ from: fromAddress, gas: "6700000" })
    .merge(options)
    .toJS();
  // NOTE: We rely on `deployed` being called above to prepare the
  // associated signer.
  const signerEth = wallet.signersMap[fromAddress];
  console.info("MinedTx from address", fromAddress);
  console.info("deployerEth.address", JSON.stringify(_options));
  const txHash = await method(...argList, _options);
  console.groupEnd();

  return untilTxMined({ txHash, eth: signerEth });
};
