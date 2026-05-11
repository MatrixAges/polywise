export default (error: unknown) => {
	return error instanceof Error && error.name === 'AbortError'
}
