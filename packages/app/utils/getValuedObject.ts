export default <T>(obj: Record<string, T>) =>
	Object.keys(obj).reduce(
		(total, key) => {
			if (obj[key] !== undefined) {
				total[key] = obj[key]
			}

			return total
		},
		{} as Record<string, T>
	)
