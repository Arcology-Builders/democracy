export const recipients = [
  { name: "Online Bot", image: "/assets/bot.png" },
  { name: "Vitalik Buterin", image: "/assets/unicorn-avatar.png" },
  { name: "cryptogoth", image: "/assets/unicorn-avatar.png" },
  { name: "XD Chief", image: "/assets/unicorn-avatar.png" },
];

export const transactions = [
  {
    recipient: { name: "cryptogoth", avatar: "/assets/bot.png" },
    amount: 1000,
    status: "SENT",
    etherscan: {
      link: "https://rinkeby.etherscan.io/epaoindp3203naipaind0n23ionad",
    },
  },
  {
    recipient: { name: "XD Chief", avatar: "/assets/piggy-avatar.png" },
    amount: 400,
    status: "RECEIVED",
    etherscan: {
      link: "https://rinkeby.etherscan.io/epaoindp3203naipaind0n23ionad",
    },
  },
  {
    recipient: { name: "XD Chief", avatar: "/assets/piggy-avatar.png" },
    amount: 400,
    status: "FAILED",
    etherscan: {
      link: "https://rinkeby.etherscan.io/epaoindp3203naipaind0n23ionad",
    },
  },
];