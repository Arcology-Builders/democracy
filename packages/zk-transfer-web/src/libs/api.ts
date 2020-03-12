import { Map, List } from "immutable";
//@ts-ignore
import { getNetwork } from "demo-utils";
import {
  TokenDeploys,
  Token,
  TokenAddress,
  TokenAddressToNoteList,
  Note,
  NoteList
} from "./types";

const eth: any = getNetwork();

type ApiProps = {
  bm: any;
  ace: any;
  demo: any;
  deploys: any;
  demoAztec: any;
  chainId: string;
  erc20Tokens: any;
  zkTokens: Map<TokenAddress, Token>;
  thisAddressNotes: Map<TokenAddress, NoteList>;
};

// Use the demo parameter as it's been previously initialized
// Don't initialize the imported members above directly
// as these are a separate instance imported by webpack build
// within demo-aztec, as opposed to the one in the democracy bundle.
export const makeApi = async (demo: any): Promise<ApiProps> => {
  const account = demo.secp256k1.accountFromPrivateKey(
    demo.keys.wallet.getAccountSync(demo.thisAddress).get("privatePrefixed")
  );

  demo.thisPublicKey = account.publicKey;
  // @ts-ignore
  const demoAztec = window.aztec;
  const chainId = await eth.net_version();
  const bm = await demo.contract.createBM({ chainId, autoConfig: true });
  const deploys: TokenDeploys = await bm.getDeploys();
  const ace = (await demo.contract.createContract("ACE")).getInstance();

  const filterToken = (list: TokenDeploys) => (regex: RegExp) => {
    return list.filter((_, name) => name.match(regex));
  };

  const securities = filterToken(deploys)(/deploy[A-Z]{3}/);
  const fetchSecurity = filterToken(securities);
  const erc20Tokens = fetchSecurity(/ERC20/);
  const zkTokens = fetchSecurity(/ZkAssetTradeable/);

  const fetcher = (address: string): Promise<Note> =>
    bm.inputter(`zkNotes/${chainId}/${demo.thisAddress}/${address}`);

  const pendingNotes = fetchNotes(fetcher, zkTokens);
  const tokenAndNotes = await Promise.all(pendingNotes);

  return {
    bm,
    ace,
    demo,
    demoAztec,
    deploys,
    chainId,
    zkTokens,
    erc20Tokens,
    thisAddressNotes: Map(tokenAndNotes)
  };
};

function fetchNotes(fetch: any, zkTokens: TokenDeploys) {
  const getTokenNote = (token: Token): Promise<TokenAddressToNoteList> =>
    new Promise(resolve => {
      const address = token.get("deployAddress");
      fetch(address)
        .then((val: NoteList) => resolve([address, val]))
        .catch(() => resolve([address, List([])]));
    });

  return zkTokens.map(getTokenNote).values();
}
