//@ts-ignore
import { getNetwork } from "demo-utils";
//@ts-ignore
// import demoAztec from "demo-aztec-lib";
// import { wallet } from 'demo-keys'
// import contract from 'demo-contract'

const eth: any = getNetwork();

type apiObject = {
  demo: any;
  demoAztec: any;
  chainId: string;
  deploys: any;
  bm: any;
  ace: any;
  zkTokens: Map<string, Map<string, any>>;
  erc20Tokens: any;
  thisAddressNotes: any;
};

// Use the demo parameter as it's been previously initialized
// Don't initialize the imported members above directly
// as these are a separate instance imported by webpack build
// within demo-aztec, as opposed to the one in the democracy bundle.
export const makeApi = async (demo: any): Promise<apiObject> => {
  const { Map, List } = demo.immutable;
  const account = demo.secp256k1.accountFromPrivateKey(
    demo.keys.wallet.getAccountSync(demo.thisAddress).get("privatePrefixed")
  );

  demo.thisPublicKey = account.publicKey;
  // @ts-ignore
  const demoAztec = window.aztec;
  const chainId = await eth.net_version();
  const bm = await demo.contract.createBM({ chainId, autoConfig: true });
  const deploys = await bm.getDeploys();
  const ace = (await demo.contract.createContract("ACE")).getInstance();

  const securities = deploys.filter((val: string, name: string) =>
    name.match(/deploy[A-Z][A-Z][A-Z]/)
  );
  const erc20Tokens = securities.filter((val: string, name: string) =>
    name.match(/ERC20/)
  );
  const zkTokens = securities.filter((val: string, name: string) =>
    name.match(/ZkAssetTradeable/)
  );

  const thisAddressNotes = new Map(
    (
      await Promise.all(
        List(
          zkTokens
            .map(
              async (val: any, name: string) =>
                new Promise((resolve, reject) => {
                  const address = val.get("deployAddress");
                  bm.inputter(
                    `zkNotes/${chainId}/${demo.thisAddress}/${address}`
                  )
                    .then((val: any) => resolve([address, val]))
                    .catch(() => resolve([address, Map({})]));
                })
            )
            .values()
        ).toJS()
      )
    ).values()
  );

  return {
    bm,
    ace,
    demo,
    demoAztec,
    deploys,
    chainId,
    zkTokens,
    erc20Tokens,
    thisAddressNotes
  };
};
