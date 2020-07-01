import React from "react";
import { SharpArrow } from "./Icons";

export const ArrowButton = (props: any) => (
  <button
    {...props}
    className={
      props.className +
      " appearance-none px-4 py-1 shadow-xs transition-shadow duration-300 hover:shadow-lg focus:shadow-lg focus:outline-none bg-primary rounded-lg"
    }
  >
    <SharpArrow
      style={{
        height: 22,
        color: "white",
      }}
    />
  </button>
);
