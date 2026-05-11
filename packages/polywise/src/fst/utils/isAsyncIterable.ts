export default (value: unknown): value is AsyncIterable<unknown> => {
	return Boolean(value) && typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function'
}
