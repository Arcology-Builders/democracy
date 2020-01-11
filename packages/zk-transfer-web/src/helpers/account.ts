export const shortenAddress = (address: string) => {
  const result = address.match(/^(.{12}).+(.{9})$/);
  if (result) return result[1] + "..." + result[2];

  return address;
};
