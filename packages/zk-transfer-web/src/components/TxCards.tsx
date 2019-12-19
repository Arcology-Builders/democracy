import React from 'react';

export const SuccessCard = () => {
    return (
    <div className="holders success-declined flex flex-col justify-center bg-white rounded-lg shadow-lg p-4 mt-5">
      <div>
        <img src="/assets/transaction-success.png" alt="" />
      </div>

      <p className="text-center font-semibold my-1">
        Your transaction has been successfully
        <span className="color6"> completed!</span>
      </p>

      <p className="text-center text-xs text-gray-600 my-1">
        Dear user , for more information about this transaction , please click
        on the button below, it will take you to the etherscan
      </p>
    </div>
    )
            
}

export const FailedCard = (props: any) => {
  return (
    <div className="holders success-declined flex flex-col justify-center bg-white rounded-lg shadow-lg p-4 mt-5">
      <div>
        <img src="/assets/transaction-failed.jpg" alt="FAILED" />
      </div>

      <p className="text-center font-semibold my-1">
        Your transaction <span className="color7">failed</span>
      </p>
      <ul className="transaction-failed bg-c-gray rounded-lg pb-2 px-2">
        <div className="mb-2 heading bg-c-gray text-sm opacity-75 -mx-2 p-2">Last Transactions</div>
        {props.children}
      </ul>
    </div>
  );
};

const types = new Map([
    ["received", "tx-success.svg"],
    ["sent", "tx-success.svg"],
    ["failed", "tx-failed.svg"]
])

const getImage = (index: string) => {
    return types.get(index);
};

export const TransactionLog = (props: { status: string, msg: string }) => {
    return (
      <li className="log block flex bg-white mb-2 text-sm py-2 px-2 rounded-lg">
        <span className="icon icon-success mr-2 flex-grow-0 flex-shrink-0">
          <img
            src={`/assets/${getImage(props.status)}`}
            alt="-"
            style={{
              transform: props.status === "received" ? "rotate(180deg)" : ""
            }}
          />
        </span>
        <span className="log-text">{props.msg}</span>
      </li>
    );
}