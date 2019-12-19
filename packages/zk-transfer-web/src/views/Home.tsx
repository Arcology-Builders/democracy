import React from "react";

import Header from '../components/LandingHeader';
import CardHeader from '../components/CardHeader';
import { SectionLabel } from "../components/Labels";
import ContactList from "../components/Recipient";
import { TokenCard, TokenInput2 } from "../components/Token";
import { SuccessCard, FailedCard, TransactionLog } from "../components/TxCards";
import Recipient from "../components/Recipient";

const onlineUser = [
    { name: 'Buzzlight', status: true, premium: true, image: "/assets/online-avatar.png" }, 
    { name: 'Anatasia', status: true, image: "/assets/db-avatar.png" }
];

const offlineUser = [
    { name: 'Cryptogirl', status: false, image: "/assets/online-avatar.png", premium: true }
];

const fakePairs: [string, string, number][] = [
    ["RBT", "#AF1500", 34200],
    ["AAAA", "#AF9E00", 1300],
    ["BMT", "#00AF5B", 1500],
    ["DAI", "#4D00AF", 65200],
    ["BAT", "#AF005E", 2500]
];

const txArray = [
  { status: 'received', msg: "Received .. RBT from Peppy Jones" },
  { status: 'sent', msg: "Successfully sent .. BMT to Anastasia" },
  { status: 'failed', msg: "Send .. DAI to Matt has failed.Try again." },
  { status: 'sent', msg: "Successfully sent .. BMT to Anastasia" },
  { status: 'failed', msg: "Send .. DAI to Matt has failed.Try again." },
  { status: 'sent', msg: "Successfully sent .. BMT to Anastasia" },
  { status: 'failed', msg: "Send .. DAI to Matt has failed.Try again." },
  { status: 'sent', msg: "Successfully sent .. BMT to Anastasia" },
  { status: 'failed', msg: "Send .. DAI to Matt has failed.Try again." },
];

const Homepage = () => {
    return (
      <>
        <Header />
        <div className="main-container py-5">
          <div className="holders your-wallet-cont flex flex-col">
            <CardHeader image="/assets/wallet.png" label="Your Wallet" />
            <div className="flex-1 avatar-address-cont flex justify-between flex-col bg-white shadow-lg rounded-lg py-5">
              <div className="avatar-cont w-full flex items-center justify-between p-5">
                <button className="appearance-none">
                  <img
                    src="/assets/left-arrow.png"
                    className="w-4"
                    alt="previous"
                  />
                </button>
                <img src="/assets/db-avatar.png" alt="" className="p-2" />
                <button className="appearance-none">
                  <img
                    src="/assets/right-arrow.png"
                    className="w-4"
                    alt="next"
                  />
                </button>
              </div>

              <article>
                <p className="font-semibold text-2xl text-center color5 mt-2">
                  Generate your avatar
                </p>
                <p className="text-center text-sm mb-2">
                  ( This is how others will see you)
                </p>
              </article>

              <div className="py-5">
                <SectionLabel text="address" />
                <div className="address-cont flex items-center my-4 px-5">
                  <span className="inline-block address-logo w-8 h-8 rounded-full text-center flex-grow-0 flex-shrink-0">
                    <img
                      src="/assets/address-logo.png"
                      alt=""
                      className="w-5 inline-block rounded-full"
                    />
                  </span>
                  <p className="address inline-block text-xs text-gray-600 mx-1">
                    0x093156d174f4F65F7B9cD82Eae4797467a6E
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="holders your-wallet-cont">
            <CardHeader
              image="/assets/money-icon.png"
              label="Choose your token"
            />
            <div className="w-full flex-1 bg-white shadow-lg rounded-lg py-5 flex flex-col justify-center">
              <TokenCard caption="ZK token balance">
                {fakePairs
                  .splice(0, 3)
                  .map(([name, color, value]: any, index) => (
                    <TokenInput2
                      key={index}
                      name={name}
                      color={color}
                      value={value}
                    />
                  ))}
              </TokenCard>
              <TokenCard caption="ERC20 token balance">
                {fakePairs.map(([name, color, value]: any, index) => (
                  <TokenInput2
                    key={index}
                    name={name}
                    color={color}
                    value={value}
                  />
                ))}
              </TokenCard>
            </div>
          </div>

          <div className="holders flex flex-col your-wallet-cont">
            <CardHeader
              image="/assets/agenda.png"
              label="Choose who receives"
            />
            <div className="w-full flex-1 bg-white shadow-lg rounded-lg py-5">
              <SectionLabel.Online text="recently online" />
              <hr className="mx-1 mb-2" />
              <div className="recent-online-cont px-2 pb-5">
                {onlineUser.map(({ name, status, image, premium }) => (
                  <Recipient
                    online={status}
                    name={name}
                    image={image}
                    premium={premium}
                  />
                ))}
              </div>
              <SectionLabel.Offline text="recently offline" />
              <div className="recent-offline mx-2">
                {offlineUser.map(({ name, status, image, premium }) => (
                  <ContactList
                    online={status}
                    name={name}
                    image={image}
                    premium={premium}
                  />
                ))}
              </div>
            </div>
          </div>

          <SuccessCard />
          <FailedCard>
            {txArray.map((data, index) => <TransactionLog key={index} {...data}/>)}
          </FailedCard>
        </div>
      </>
    );
};

export default Homepage;