import screenNameGenerator from "docker-names";

export const setScreenName = (screenName: string, chainId: string) => 
  localStorage.setItem(`demo/${chainId}/thisScreenName`, screenName);

export const getScreenName = (chainId: string) =>
  localStorage.getItem(`demo/${chainId}/thisScreenName`)
  
export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

export const generateScreenName = () => {
  const regex = /(\w+)_(\w+)/gi;
  const replaceFn = (tokn: any, $1: any, $2: any) => capitalize($1) + " " + capitalize($2);
  return screenNameGenerator.getRandomName().replace(regex, replaceFn);
}