import React, { useState, useContext } from "react";
import { getColor } from '../util';
import Header from "../components/Header";
import Card from "../components/Card";
import TokenInput, { Skeleton, CircularText, TokenGroup } from "../components/Token";
import UserList from "../components/UserList";
import StaticContent from "../components/StaticContent";
import Preloader from "../components/Preloader";
import Democracy from "../components/context/Democracy";
import { TokenAddressToNotesMap } from "../libs/types";
import { List } from 'immutable';

type User = {
  name: string;
  image: string;
};

const users: User[] = [
  { name: "Online Bot", image: "/assets/bot.png" },
  { name: "Vitalik Buterin", image: "/assets/unicorn-avatar.png" }
];

type TransactionProps = {
  screenName: string;
  tokens: TokenAddressToNotesMap;
}

const MakeTransaction = ({ screenName, tokens }: TransactionProps) => {
  const fakePairs: [string, string, number, number][] = [
    // ["RBT", "#AF1500", 200, 200],
    // ["AAAA", "#AF9E00", 300, 400],
    // ["BMT", "#00AF5B", 500, 300],
    ["GNO", "#0066AF", 100, 100],
    ["DAI", "#4D00AF", 200, 200],
    ["MKR", "#AF005E", 500, 500]
  ];

  const [state, setState]: [any, Function] = useState({
    stage: 1,
    current: null,
    sending: false
  });
  
  const stage = (s_: number) => () => setState({ ...state, stage: s_ });
  
  const isStage = (s_: number) => state.stage === s_;
  
  const fade = (s_: number) => isStage(s_) || "opacity-25";
  
  const allowEdit = (current: string | null) => () => {
    // console.log('changing to the ' + current);
    setState({ ...state, current: current });
  };
  
  const sentTo = (user: User) => () => {
    console.log("Sending to " + user.name);
    setState({ ...state, sending: true });
    
    setTimeout(() => {
      setState({ ...state, sending: false, stage: 1 });
    }, 3000);
  };
  const demo: any = useContext(Democracy);
  
  return (
    <>
      <Header thisAddress={demo.thisAddress} screenName={screenName} />
      <div className="container lg:w-2/3 flex mx-auto justify-around mt-10">
        <div className="flex-1 max-w-md">
          <Card active={isStage(1)}>
            <p className={`text-5xl leading-none pl-2 pr-8 ${fade(1)}`}>1</p>
            <div className="flex-1">
              <p className="uppercase text-lg">CHOOSE A TOKEN</p>
              <p className="text-xs color3 mb-8">
                Standard erc20s or private erc1724s
              </p>
              <TokenGroup name="Private ZK Tokens - ERC1724">
                {!tokens.size && Array(3).fill(0).map((e, idx) => <Skeleton key={idx} />)}
                {List(tokens.entries()).map(([tradeSymbol,notes], idx) => {
                  return (<TokenInput
                    key={idx}
                    tradeSymbol={tradeSymbol}
                    notes={notes}
                    canEdit={tradeSymbol === state.current}
                    allowEdit={allowEdit(tradeSymbol)}
                    onSend={stage(2)}
                    >
                    <CircularText color={getColor(tradeSymbol)} label={tradeSymbol} />
                  </TokenInput>)
                })}
              </TokenGroup>
              <TokenGroup name="Standard Tokens - ERC20">
                {fakePairs.map(([label, color, a, b], index) => (
                  <TokenInput
                    key={index}
                    tradeSymbol={label}
                    canEdit={label === state.current}
                    notes={List([])}
                    allowEdit={allowEdit(label)}
                    onSend={stage(2)}
                  >
                    <CircularText label={label} color={color} />
                  </TokenInput>
                ))}
              </TokenGroup>
            </div>
          </Card>
          {state.sending && (
            <div className="acc-info text-sm p-4">
              <div className="mt-2">
                <p>Send another token</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col max-w-md">
          <Card active={isStage(2)}>
            <p className={`text-5xl leading-none pl-2 pr-8 ${fade(2)}`}>2</p>
            <div className="flex-1">
              <p className="uppercase text-lg">CHOOSE RECIPIENT</p>
              <p className="text-xs color3 mb-8">
                Other online users, or Mr. Robot
              </p>
              <div className="text-sm mb-2">Search for user...</div>
              <ul className="user-list flex flex-col w-5/6">
                {users.map((user, index) => (
                  <UserList key={index} {...user} onSend={sentTo(user)} />
                ))}
              </ul>
            </div>
          </Card>
          {state.sending && (
            <div className="acc-info text-sm p-4">
              <div className="flex">
                <Preloader />
                <span className="ml-2">The transaction is being mined</span>
              </div>
              <div className="flex mt-2">
                <img
                  src="/assets/logo-ether.png"
                  alt="eth"
                  className="icons icon-lg"
                />
                <span className="text-gray">0x291F1ic810…2BgSdifB7</span>
              </div>
              <div className="mt-2">
                <p>
                  Check the data on etherscan or send an ERC20 token, to see the
                  difference!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <StaticContent />
    </>
  );
};

export default MakeTransaction;
