export default <T>(arr: Array<T>, key: string): Array<T> => {
	const map = {}

	arr.forEach(item => {
		const uniq_value = item[key]

		map[uniq_value] = item
	})

	return Object.values(map)
}
