export default <T>(value: unknown) => {
	return Array.isArray(value) ? (value as Array<T>) : []
}
