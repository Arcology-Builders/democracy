import React from "react";

type IconProps = {
  style?: object;
};

export const ArrowRight = (props: IconProps) => {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={props.style}
    >
      <path
        d="M1 6H11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 1L11 6L6 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SharpArrow = (props: IconProps) => {
  return (
    <svg
      width="19"
      height="10"
      viewBox="0 0 19 10"
      fill="none"
      style={props.style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.51678 0.399414H11.2148L18.1404 4.75896L15.1791 5.30391H0.157227V4.21402H15.1791L10.8974 1.4893H4.51678V0.399414Z"
        fill="white"
      />
      <path
        d="M10.8977 8.02876H4.51709V9.11865H11.2151L18.1407 4.7591L15.1794 5.30405L10.8977 8.02876Z"
        fill="white"
      />
    </svg>
  );
};

export const CopyIcon = (props: IconProps) => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      style={props.style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4.5"
        y="7.7666"
        width="13.9743"
        height="13.9327"
        rx="1.5"
        fill="white"
        stroke="#B280FC"
      />
      <rect
        x="7.20898"
        y="3"
        width="14.9743"
        height="15.9994"
        rx="2"
        fill="#B280FC"
      />
    </svg>
  );
};

export const LinkExternalIcon = (props: IconProps) => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      style={props.style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.5363 5.65357H13.5245C13.6885 4.71412 14.5082 4 15.4946 4H20.6147C21.7192 4 22.6147 4.89543 22.6147 6V11.0948C22.6147 12.0827 21.8983 12.9034 20.9566 13.0656V7.06176L5.40812 22.4772L4 21.0569L19.5363 5.65357ZM20.9563 5.65357L20.9566 5.65388V5.65357H20.9563Z"
        fill="#B280FC"
      />
    </svg>
  );
};

export const TxFailedIcon = () => {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="28.6397"
        height="28.5573"
        rx="14.2787"
        stroke="#FF9E9E"
      />
      <path
        d="M9 21L21 9M21 21L9 9"
        stroke="#FF9E9E"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export const TxReceivedIcon = () => {
  return (
    <svg
      width="30"
      height="31"
      viewBox="0 0 30 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="29.3984"
        y="29.95"
        width="28.6397"
        height="28.5573"
        rx="14.2787"
        transform="rotate(180 29.3984 29.95)"
        stroke="#3DD9EA"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.6857 17.0642C21.0094 17.387 21.0094 17.9105 20.6857 18.2334L15.5311 23.3736C15.1401 23.7636 14.506 23.7636 14.1149 23.3736L8.96027 18.2333C8.63656 17.9105 8.63656 17.3871 8.96027 17.0643C9.28397 16.7415 9.80881 16.7415 10.1325 17.0643L12.1122 19.0384C12.743 19.6675 13.8217 19.222 13.8216 18.3323L13.8215 8.26112C13.8215 7.7096 14.2698 7.2625 14.8229 7.2625C15.3759 7.26249 15.8243 7.70957 15.8243 8.26109L15.8244 18.3319C15.8244 19.2216 16.9031 19.6671 17.5339 19.038L19.5132 17.0642C19.837 16.7413 20.3619 16.7413 20.6857 17.0642ZM14.8229 21.7415C14.8229 21.7415 14.8229 21.7414 14.8228 21.7414C14.8228 21.7414 14.8227 21.7415 14.8228 21.7415C14.8228 21.7415 14.8228 21.7415 14.8229 21.7415Z"
        fill="#3DD9EA"
      />
    </svg>
  );
};

export const TxSentIcon = () => {
  return (
    <svg
      width="30"
      height="31"
      viewBox="0 0 30 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.758301"
        y="1.27344"
        width="28.6397"
        height="28.5573"
        rx="14.2787"
        stroke="#F1F1F1"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.8851 13.5744L15.334 7.14347L21.7829 13.5744L20.6106 14.7435L16.3354 10.4802L16.3356 23.9607L14.3328 23.9607L14.3327 10.4804L10.0575 14.7436L8.8851 13.5744ZM15.3341 9.48178L15.3342 9.48178L15.3341 9.4817L15.3341 9.48178Z"
        fill="#B280FC"
      />
    </svg>
  );
};
