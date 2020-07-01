import React from "react";
import TokenInput, { CircularText } from "./Token";
import { getColor } from "../util";
import { NoteList } from "../libs/types";

export const TokenGroup = (props: any) => {
  return (
    <div className="private-token-cont mt-8">
      <p className="text-sm mb-2 pl-16">{props.name}</p>
      <div className="token-cont">
        {!props.tokenList.size && <ShowSkeletons />}
        {props.tokenList.map(([tradeSymbol, notes]: [string, NoteList]) => (
          <TokenInput
            key={tradeSymbol}
            notes={notes || props.notes}
            lock={props.locked(tradeSymbol)}
            tradeSymbol={tradeSymbol}
            allowEdit={props.allowEdit(tradeSymbol)}
            onSend={props.onSend}
          >
            <CircularText color={getColor(tradeSymbol)} label={tradeSymbol} />
          </TokenInput>
        ))}
      </div>
    </div>
  );
};

const ShowSkeletons = () => (
  <>
    {["a", "b", "c"].map((e) => (
      <Skeleton key={e} />
    ))}
  </>
);

export const Skeleton = () => {
  return (
    <div className="flex my-1 items-center">
      <div className="w-10 h-10 rounded-full flex-shrink-0 zk-preload bg-_1" />
      <div className="flex-1 rounded-lg ml-4 h-8 zk-preload bg-_1" />
    </div>
  );
};

export default TokenGroup;
