import { Map, List } from "immutable";

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

/** Hex(42) */
export type TokenAddress = string;

/** Char(3) - Char(4) eg. AAA */
export type TradeSymbol = string;

export interface ZkToken extends Map<string, any> {
  code: string; // Hex(30480)
  name: string; // "ZKAssetTradable"
  type: string; // "deploy"
  chainId: string; // Ethereum Network Id
  deployAddress: TokenAddress;
  deployDate: string; // Human readable date format
  deployId: string; // deployABC
  deployTime: number; // 15795271511
  deployTx: object; // transaction data
  linkId: string; //
  abi: []; // Some constants
}

export interface ERC20Token extends ZkToken {}

export type Token = ZkToken | ERC20Token;

export type NoteList = List<Note>;

export type TokenDeploys = Map<TokenAddress, Token>;

export type TokenAddressToNoteList = [TokenAddress, NoteList];

export type TokenAddressToNotesMap = Map<TokenAddress, NoteList>;

export interface NoteValue {
  owner: string;
  a: string;
  k: string;
  gamma: string[];
  sigma: string[];
  metaData: string; // Hex(68)
  noteHash: string; // Hex(66)
}

export declare function BMInputter(address: string): Promise<Note>;
