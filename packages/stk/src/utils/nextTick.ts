export default () => {
	const { promise, resolve } = Promise.withResolvers()

	process.nextTick(() => resolve(0))

	return promise
}
