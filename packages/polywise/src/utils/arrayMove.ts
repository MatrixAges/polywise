export default <T>(args: { list: Array<T>; from: number; to: number }) => {
	const { list, from, to } = args
	const next_list = [...list]
	const [target_item] = next_list.splice(from, 1)

	if (target_item === undefined) {
		return list
	}

	next_list.splice(to, 0, target_item)

	return next_list
}
