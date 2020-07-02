import React from "react";
import Card from "./Card";
import { useStore } from "../hooks/useDemo";
import { useStage } from "../hooks/useStage";
import { TransactionLog as LogType } from "../libs/types";
import {
  CopyIcon,
  LinkExternalIcon,
  TxFailedIcon,
  TxReceivedIcon,
  TxSentIcon,
} from "../components/Icons";

export const TransactionLog = (props: any) => {
  const { isStage } = useStage();
  const { transactions } = useStore();

  return (
    <Card
      active={isStage(3)}
      heading="TRANSACTIONS"
      subHeading="Log of recent transactions you’ve made"
    >
      <div className="user-list mt-8 relative -ml-2 -mr-4">
        <div className="bg-_1 w-100 transform ml-2 translate-x-12 min-h-screen absolute rounded-large inset-0 z-0" />
        <li className="flex flex-col relative z-10">
          {transactions.map((info, index) => (
            <Log key={index} {...info} />
          ))}
        </li>
      </div>
    </Card>
  );
};

const Log = ({ recipient, etherscan, status, amount }: LogType) => {
  return (
    <div
      className="
      log-item flex justify-between items-center px-4 py-2 w-full 
      select-none overflow-hidden border-b border-solid border-white
      "
    >
      <div className="inline-flex items-center">
        <span className="mr-6">
          <StatusIcon status={status} />
        </span>
        <img
          src={recipient.avatar}
          className="w-6 h-6 bg-transparent mr-4"
          alt={"avatar for " + recipient.name}
        />
        <span className="text-sm opacity-75">{recipient.name}</span>
      </div>
      <div className="inline-flex">
        <span className="inline-block mx-4">{amount}</span>
        <span
          role="link"
          className="transform translate-x-20 flex flex-no-wrap"
        >
          <a href={etherscan.link} title="copy" className="flex-grow-0">
            <CopyIcon />
          </a>
          <a
            href={etherscan.link}
            title="view on etherscan"
            className="flex-grow-0"
          >
            <LinkExternalIcon />
          </a>
        </span>
      </div>
    </div>
  );
};

const StatusIcon = ({ status }: { status: string | boolean }) => {
  switch (status) {
    case "SENT":
      return <TxSentIcon />;
    case "FAILED":
      return <TxFailedIcon />;
    case "RECEIVED":
      return <TxReceivedIcon />;
  }

  return null;
};

export default TransactionLog;
