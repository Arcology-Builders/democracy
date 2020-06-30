import React from "react";

type TxCardProps = {
  active: boolean;
  children: any;
  heading: string;
  subHeading: string;
};

const fade = (a: boolean) =>
  a
    ? "shadow-2xl scale-105"
    : "pointer-events-none scale-100 opacity-75 shadow-lg pointer-events-none";

const Card = ({ active, children, heading, subHeading }: TxCardProps) => {
  const className =
    fade(active) +
    ` relative choose-token-container transform transition-all overflow-hidden
    duration-500 ease-in-out flex flex-col flex-1 w-full bg-white rounded-lg p-8`;

  return (
    <section className={className} style={{ borderRadius: 23 }}>
      <div className="flex">
        <div className="w-12 h-12 rounded-lg bg-gray-200 mr-4" />
        <hgroup>
          <h3 className="uppercase text-lg">{heading}</h3>
          <p className="text-xs color3">{subHeading}</p>
        </hgroup>
      </div>
      {children}
    </section>
  );
};

export default Card;
