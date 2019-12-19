// @ts-ignore
import React, { useState, useEffect, useRef } from "react";
import arrowLeft from "../assets/arrow-left.svg";

type TokenPropType = {
  firstValue: number;
  secondValue: number;
  children: any;
  canEdit?: boolean;
  onSend: Function;
  allowEdit?: Function;
};

const TokenInput = (props: TokenPropType) => {
  const editMode = props.canEdit;
  const [digit, setDigit] = useState(props.firstValue);
  const input = useRef(null);

  const setEditMode = (a?: boolean) => props.allowEdit && props.allowEdit();
  const canEdit = (cb: Function) => (...args: any[]) =>
    props.canEdit && cb(...args);

  useEffect(() => {
    canEdit((a: any) => {
      // console.log('The input at first', a);
      if (a) a.current.focus();
    })(input);
  });

  return (
    <div
      className="token flex items-center py-1"
      onMouseEnter={() => setEditMode()}
    >
      {props.children}
      <input
        ref={input}
        value={digit}
        disabled={!props.canEdit}
        onChange={canEdit((e: any) => setDigit(e.target.value))}
        onFocus={canEdit(() => setEditMode(!editMode))}
        className="appearance-none text-base w-12 text-right rounded border"
      />
      <div className="h-5 flex-shrink-0 bg-gray-400 border mx-1"></div>
      {!editMode ? (
        <span className="px-1 text-base">{props.secondValue}</span>
      ) : (
        <button
          className="appearance-none"
          onClick={() => {
            setEditMode(!editMode);
            props.onSend();
          }}
        >
          <img
            src={arrowLeft}
            className="ml-4"
            alt="send"
            style={{ width: 15, height: 15 }}
          />
        </button>
      )}
    </div>
  );
};

TokenInput.defaultProps = {
  canEdit: false
};

type CTProps = {
  color: string;
  label: string;
  fill?: boolean;
};

export const CircularText = ({ color, label, fill }: CTProps) => {
  const variant = fill 
    ? ({ backgroundColor: color, color: 'white', border: 'none' })
    : ({ color: color, borderColor: color });

  return (
    <span
      className="mr-5 inline-flex justify-center items-center 
          text-xs uppercase border rounded-full p-1 mr-2"
      style={{
        ...variant,
        width: 40,
        height: 40,
        flex: '0 0 40px',
        lineHeight: 1.5
      }}
    >
      {label}
    </span>
  );
};

CircularText.defaultProps = {
  fill: false
}

export const TokenGroup = (props: any) => {
  return (
    <div className="private-token-cont mt-8">
      <p className="text-sm mb-2">{props.name}</p>
      <div className="token-cont">{props.children}</div>
    </div>
  );
};

export const TokenInput2 = (props: any) => {
  return (
    <div className="zk-token-input flex justify-between items-center rounded-lg p-2 my-4">
      <div className="flex-1">
        <CircularText label={props.name} fill={true} color={props.color} />
      </div>
      <input type="text" className="appearance-none self-stretch border-none px-3 w-32 py-1 bg-gray-100 rounded-lg" />
      <span className="color5 flex-1 py-1 inline-block px-4">
        { props.value }
      </span>
    </div>
  )
}

export const TokenCard = (props: any) => {
  return (
    <div className="zk-t-balance-cont mx-3 mb-4">
      <div className="zk-token-cont text-sm py-2">
        <p>{props.caption}</p>
      </div>
      <div className="px-2">
        {props.children}
      </div>
    </div>
  );
};

export default TokenInput;
