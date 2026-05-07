export default (file_path: string, message: string) => ({
	status: 'error' as const,
	message,
	file_path
})
