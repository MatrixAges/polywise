export default <T>(prev: T, next: T | void) => {
	if (typeof next === 'undefined') {
		return prev
	}

	if (
		prev &&
		next &&
		typeof prev === 'object' &&
		typeof next === 'object' &&
		!Array.isArray(prev) &&
		!Array.isArray(next)
	) {
		return { ...(prev as Record<string, unknown>), ...(next as Record<string, unknown>) } as T
	}

	return next
}
