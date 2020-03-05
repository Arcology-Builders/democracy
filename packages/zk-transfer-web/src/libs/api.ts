//@ts-ignore
import { getNetwork } from "demo-utils";
import { Token, TokenList, Note, NoteList, KeyValuePair } from "./types";

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
  const { Map } = demo.immutable;
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

  const fetcher = (address: string): Promise<Note> =>
    bm.inputter(`zkNotes/${chainId}/${demo.thisAddress}/${address}`);

  const defaultNote = Map({});
  const pendingNotes = fetchNotes(fetcher, zkTokens, defaultNote);
  const thisAddressNotes = Map(await Promise.all(pendingNotes));

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

function fetchNotes(
  fetch: any,
  zkTokens: TokenList<Token>,
  defaultType: Map<string, string>
): Promise<KeyValuePair<Note>>[] {
  return zkTokens
    .map(
      async token =>
        new Promise(resolve => {
          const address = token.get("deployAddress");
          fetch(address)
            .then((val: Note) => resolve([address, val]))
            .catch(() => resolve([address, defaultType]));
        })
    )
    .values();
}
