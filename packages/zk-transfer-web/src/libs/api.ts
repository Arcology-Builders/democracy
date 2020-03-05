//@ts-ignore
import { getNetwork } from "demo-utils";
import { Token, TokenList, NoteList } from "./types";

const eth: any = getNetwork();

type apiObject = {
  bm: any;
  ace: any;
  demo: any;
  deploys: any;
  demoAztec: any;
  chainId: string;
  erc20Tokens: any;
  thisAddressNotes: NoteList;
  zkTokens: TokenList<Token>;
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
  const deploys: TokenList<Token> = await bm.getDeploys();
  const ace = (await demo.contract.createContract("ACE")).getInstance();

  const filterToken = (list: TokenList<Token>) => (regex: RegExp) => {
    return list.filter((_, name) => name.match(regex));
  };

  const securities = filterToken(deploys)(/deploy[A-Z][A-Z][A-Z]/);
  const fetchSecurity = filterToken(securities);
  const erc20Tokens = fetchSecurity(/ERC20/);
  const zkTokens = fetchSecurity(/ZkAssetTradeable/);

  const thisAddressNotes = new Map(
    (
      await Promise.all(
        List(
          zkTokens
            .map(
              async val =>
                new Promise(resolve => {
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
