export default (error: unknown) => {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack || ''
		}
	}

	return {
		message: String(error)
	}
}
