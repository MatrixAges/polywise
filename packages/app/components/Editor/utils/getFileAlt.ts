export default (name: string) => {
	const arr = name.split('.')

	arr.pop()

	return arr.join()
}
