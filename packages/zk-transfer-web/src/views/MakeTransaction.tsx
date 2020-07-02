import React from "react";

import Header from "../components/Header";
import Card from "../components/Card";
import Recipient from "../components/ZKRecipient";
import TransactionLog from "../components/TransactionLog";
// import { StageProps } from "../components/Token";
import { TokenGroup } from "../components/TokenGroup";
// import StaticContent from "../components/StaticContent";
import Preloader from "../components/Preloader";
import { TokenAddressToNotesMap } from "../libs/types";
import { List } from "immutable";
import { useStage } from "../hooks/useStage";
import { useDemo, useStore } from "../hooks/useDemo";
import { useOnlyActive } from "../hooks/useOnlyActive";

const MakeTransaction = () => {
  const { sendTo } = useDemo();
  const { isStage, setStage } = useStage();
  const { current, setCurrent, isCurrent } = useOnlyActive()
  const { ZKTokens: tokens, recipients, sending } = useStore();
  const fakePairs: [string, string, number, number][] = [
    // ["RBT", "#AF1500", 200, 200],
    // ["AAAA", "#AF9E00", 300, 400],
    // ["BMT", "#00AF5B", 500, 300],
    ["GNO", "#0066AF", 100, 100],
    ["DAI", "#4D00AF", 200, 200],
    ["MKR", "#AF005E", 500, 500],
  ];

  return (
    <main className="flex flex-col justify-center gradient-bg min-h-screen">
      <Header />
      <figure className="flex flex-col justify-center items-center">
        <span
          className="w-12 h-12 bg-primary block"
          style={{ filter: "blur(20px)", opacity: 0.38 }}
        />
        <img
          src={require("../assets/logo.svg")}
          alt="ZK Trasnfer Logo"
          className=" -mt-20 relative z-10"
        />
      </figure>

      <div className="w-full flex justify-around py-10">
        <div className="flex-1 max-w-sm">
          <Card
            active={isStage(1)}
            heading="CHOOSE A TOKEN"
            subHeading="Standard erc20s or private erc1724s"
          >
            <TokenGroup
              name="Private ZK Tokens - ERC1724"
              tokenList={List(tokens.entries())}
              locked={(key: string) => !isCurrent(key)}
              allowEdit={(e: string) => () => setCurrent(e)}
              onSend={() => setStage(2)}
            />

            <TokenGroup
              name="Standard Tokens - ERC20"
              tokenList={List(fakePairs)}
              notes={List([])}
              locked={(key: string) => !isCurrent(key)}
              allowEdit={(e: string) => () => setCurrent(e)}
              onSend={() => setStage(2)}
            />
          </Card>
        </div>

        <div className="flex-1 flex flex-col max-w-sm">
          <Card
            active={isStage(2)}
            heading="CHOOSE RECIPIENT"
            subHeading="Other online users, or Mr. Robot"
          >
            <section className="flex flex-col justify-between flex-1 text-sm">
              <ul className="flex flex-col mt-10">
                {recipients.map((user, index) => (
                  <Recipient key={index} {...user} onSend={sendTo(user)} />
                ))}
              </ul>
              <div className="text-center">
                Click <b className="text-primary">Send</b> to initiate begin
                transaction
              </div>
              <div
                className={
                  (sending ? "translate-y-0" : "translate-y-56") +
                  ` flex items-center transition-all transform duration-1000 ease-out 
                    pt-4 pb-5 bg-_1 absolute bottom-0 left-0 right-0
                  `
                }
              >
                <div className="px-5 relative text-center w-full flex justify-center">
                  <span className="text-sm">Processing Transaction</span>
                  <span className="absolute right-0 opacity-50 mr-10">
                    <Preloader />
                  </span>
                </div>
              </div>
            </section>
          </Card>

          {/* {state.sending && (
            <div className="acc-info text-sm p-4">
              <div className="flex">
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
          )} */}
        </div>

        <div className="flex-1 flex flex-col max-w-sm">
          <TransactionLog />
        </div>
      </div>

      {/* <StaticContent /> */}
    </main>
  );
};

export default MakeTransaction;
