import React, { useState, useCallback, useEffect, useRef } from "react";
import { note } from "aztec.js";
import { ArrowButton } from "./Buttons";
import { NoteList, NoteValue } from "../libs/types";

export type StageProps = {
  noteHash: any;
  amount: number;
  tradeSymbol: string;
};

type TokenPropType = {
  tradeSymbol: string; // AAA | BBB | ABC
  firstValue?: number;
  secondValue?: number;
  children: any;
  lock: boolean;
  notes: NoteList;
  allowEdit: Function;
  onSend(a: StageProps): void;
};

const useNotes = (
  notes: NoteList
): { balance: number; error: Error | null } => {
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);

  const fetchValue = useCallback((notes: NoteList): Promise<NoteValue[]> => {
    const getNoteValue = function (e: any) {
      return note.fromViewKey(e.get("viewingKey"));
    };
    const pendingValues: any = notes.map(getNoteValue);
    //@ts-ignore
    return Promise.all(Array.from(pendingValues));
  }, []);

  const fetchNotes = async (notes: NoteList) => {
    //  console.log('Fetching balances for ', props.tradeSymbol);
    try {
      const values = await fetchValue(notes);
      const amount = values.reduce((s, v) => s + parseInt(v.k), 0);
      setBalance(amount);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    fetchNotes(notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  return { balance, error };
};

// Greater than
const gt = (a: number, b: number) => a > b;

export const TokenInput = (props: TokenPropType) => {
  const input = useRef(null);
  const locked = props.lock;
  const [txAmount, setTxAmount] = useState(0);
  const { balance } = useNotes(props.notes);

  React.useEffect(() => {
    setTxAmount(balance);
  }, [balance]);

  const unlock = () => props.allowEdit();
  // gt(txAmount, balance)

  return (
    <div className="token flex w-full items-center py-1" onMouseEnter={unlock}>
      {props.children}
      <div className="flex relative items-center flex-1">
        <input
          ref={input}
          value={txAmount}
          disabled={locked}
          onChange={(evt) => setTxAmount(parseInt(evt.target.value) || 0)}
          className="flex-1 appearance-none text-base px-3 py-2 border-2 border-solid border-gray-200 focus:border-black"
        />
        <ArrowButton
          className="mr-2 absolute right-0 "
          disabled={gt(txAmount, balance)}
          onClick={() => {
            // unlock();
            props.onSend({
              tradeSymbol: props.tradeSymbol,
              amount: txAmount,
              noteHash: props.notes,
            });
          }}
        />
      </div>
    </div>
  );
};

TokenInput.defaultProps = {
  lock: true,
};

type CTProps = {
  color: string;
  label: string;
  fill?: boolean;
};

export const CircularText = ({ color, label, fill }: CTProps) => {
  const variant = fill
    ? { backgroundColor: color, color: "white", border: "none" }
    : { color: color, borderColor: color };

  return (
    <span
      className="mr-5 inline-flex justify-center items-center 
          text-xs uppercase border rounded-full p-1 mr-2"
      style={{
        ...variant,
        width: 40,
        height: 40,
        flex: "0 0 40px",
        lineHeight: 1.5,
      }}
    >
      {label}
    </span>
  );
};

CircularText.defaultProps = {
  fill: false,
};

export const TokenInput2 = (props: any) => {
  return (
    <div className="zk-token-input flex justify-between items-center rounded-lg p-2 my-4">
      <div className="flex-1">
        <CircularText
          label={props.tradeSymbol}
          fill={true}
          color={props.color}
        />
      </div>
      <input
        type="text"
        className="appearance-none self-stretch border-none px-3 w-32 py-1 bg-gray-100 rounded-lg"
      />
      <span className="color5 flex-1 py-1 inline-block px-4">
        {props.value}
      </span>
    </div>
  );
};

export const TokenCard = (props: any) => {
  return (
    <div className="zk-t-balance-cont mx-3 mb-4">
      <div className="zk-token-cont text-sm py-2">
        <p>{props.caption}</p>
      </div>
      <div className="px-2">{props.children}</div>
    </div>
  );
};

export default React.memo(TokenInput);
