export type ERCToken = Map<any, any>;

export interface Note extends Map<string, any> {
  _id: string;
  type: string;
  status: string;
  dateTime: string;
  timestamp: number;
  tokenAddress: string; // Hex(42)
  ownerAddress: string; // Hex(42)
  viewingKey: string; // Hex(140)
  chainId: string; // Char(Int)
  zkNoteHash: string; // Hex(66)
}

export interface ZkToken extends Map<string, any> {
  code: string; // Hex(30480)
  name: string; // "ZKAssetTradable"
  type: string; // "deploy"
  chainId: string; // Ethereum Network Id
  deployAddress: string; // Hex(42)
  deployDate: string; // Human readable date format
  deployId: string; // deployABC
  deployTime: number; // 15795271511
  deployTx: object; // transaction data
  linkId: string; //
  abi: []; // Some constants
}

export type Token = ZkToken | ERCToken;

export interface TokenList<T> extends ArrayLike<T> {
  values(): Object;
  map<U>(f: (first: T, key: string) => U): any;
  forEach<U>(f: (first: T, key: string) => U): void;
  filter<U>(f: (first: T, key: string) => U): TokenList<T>;
  mapEntries<U>(f: (entry: KeyValuePair<T>, key: string) => U): TokenList<T>;
}

export type KeyValuePair<L> = [string, L];

export interface NoteList extends TokenList<Note> {
  get(address: string): NoteList;
  filter<U>(f: (first: Note, key: string) => U): NoteList;
  mapEntries<U>(f: (first: KeyValuePair<Note>, key: string) => U): NoteList;
}

export interface BN {
  add(address: string): Number;
}

export interface NoteValue {
  owner: string;
  a: string;
  k: string;
  gamma: string[];
  sigma: string[];
  metaData: string; // Hex(68)
  noteHash: string; // Hex(66)
}
