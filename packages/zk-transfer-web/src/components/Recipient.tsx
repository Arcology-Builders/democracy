import React from "react";

type RecipientProps = { 
  image: string; 
  name: string; 
  online: boolean;
  premium?: boolean;
};

const Recipient = ({ name, online, image, premium }: RecipientProps) => {
  return (
    <div className="ic-contact flex items-center justify-between rounded-lg p-2 my-2">
      <div className="ro-avatar-cont flex items-center">
        <img src={image} alt="avatar" className="ic-avatar" />
        <span
          className={`ro-online w-3 h-3 rounded-full bg-green-300 ${!online &&
            "offline"}`}
        ></span>
        <p className="mx-2">{name}</p>
      </div>
      {premium ? (
        <img src="/assets/star.png" alt="star" className="w-6" />
      ) : (
        <div />
      )}
    </div>
  );
};

export default Recipient;
