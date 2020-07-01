import React from "react";
import { ArrowButton } from "./Buttons";

type Props = {
  name: string;
  image: string;
  onSend: Function;
};

const Recipient = ({ name, image, onSend }: Props) => {
  return (
    <li
      className={`
        flex justify-between rounded-large block py-2 px-4 relative w-auto
        items-center text-sm px-5 hover:bg-_1 -mx-2
      `}
      onClick={() => onSend()}
    >
      <div className="inline-flex">
        <img src={image} alt={name + " image"} />
        <span className="flex-1 name pl-8">{name}</span>
      </div>
      <ArrowButton className="-mr-2" />
    </li>
  );
};

export default Recipient;
