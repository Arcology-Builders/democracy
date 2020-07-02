import React from 'react'

export const useOnlyActive = () => {
	const [current, setCurrent] = React.useState("");

	const isCurrent = (key: string) => key === current;

	return { setCurrent, isCurrent, current }
}

export default useOnlyActive;