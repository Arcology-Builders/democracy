import { generateScreenName, getScreenName, setScreenName } from "../util";

export const useScreenName = () => {
	const getScreenNameOrCreateNew = ((chainId: string) : string => {
		const name = getScreenName(chainId);

		if (!name) {
			const newName = generateScreenName()
			setScreenName(newName, chainId)
			return newName;
		}

		return name
	})

	return { getScreenNameOrCreateNew }
}