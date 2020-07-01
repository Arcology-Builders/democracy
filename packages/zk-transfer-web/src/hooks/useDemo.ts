import React from "react";
// import { Map } from "immutable";
import Democracy from "../components/context/Democracy";
// import {
//   FAKE_RECEIVER_ADDRESS,
//   FAKE_RECEIVER_PUBLIC_KEY,
// } from "../libs/constants";
// import { doCX } from "../libs/txHelpers";
import { useStage } from "./useStage";
import { TransactionLog } from "../libs/types";

type User = {
  name: string;
  image: string;
};

const recipients: User[] = [
  { name: "Online Bot", image: "/assets/bot.png" },
  { name: "Vitalik Buterin", image: "/assets/unicorn-avatar.png" },
  { name: "cryptogoth", image: "/assets/unicorn-avatar.png" },
  { name: "XD Chief", image: "/assets/unicorn-avatar.png" },
];

const transactions: TransactionLog[] = [
  {
    recipient: { name: "cryptogoth", avatar: "/assets/bot.png" },
    amount: 1000,
    status: "SENT",
    etherscan: {
      link: "https://rinkeby.etherscan.io/epaoindp3203naipaind0n23ionad",
    },
  },
  {
    recipient: { name: "XD Chief", avatar: "/assets/piggy-avatar.png" },
    amount: 400,
    status: "RECEIVED",
    etherscan: {
      link: "https://rinkeby.etherscan.io/epaoindp3203naipaind0n23ionad",
    },
  },
  {
    recipient: { name: "XD Chief", avatar: "/assets/piggy-avatar.png" },
    amount: 400,
    status: "FAILED",
    etherscan: {
      link: "https://rinkeby.etherscan.io/epaoindp3203naipaind0n23ionad",
    },
  },
];

type Demo = {
  demo: any;
  sendTo: Function;
  allowEdit: Function;
  recipients: User[];
  state: {
    sending: boolean;
    current: any;
  };
  transactions: TransactionLog[];
};

export const useDemo = (): Demo => {
  const { setStage } = useStage();
  const demo: any = React.useContext(Democracy);

  const [state, setState]: [any, Function] = React.useState({
    current: null,
    sending: false,
  });

  // const makeCX = doCX(demo);

  const sendTo = (user: User) => () => {
    console.log("Sending to " + user.name);

    setState({ ...state, sending: true });
    // makeCX({
    //   recipient: Map({
    //     address: FAKE_RECEIVER_ADDRESS,
    //     publicKey: FAKE_RECEIVER_PUBLIC_KEY,
    //   }),
    //   ...state.txData,
    // });

    setTimeout(() => {
      setStage(3);
      setState({ ...state, sending: false });
    }, 3000);
  };

  const allowEdit = React.useCallback(
    (tradeSymbol: string) => () => {
      console.log("callling allowEdit");
      setState({ ...state, current: tradeSymbol });
    },
    [state]
  );

  return { recipients, transactions, state, sendTo, allowEdit, demo };
};
