export default (command: string) => {
	const normalized_command = command.trim()

	if (!normalized_command) return ''

	const first_segment = normalized_command.split(/\s+/)[0] ?? ''

	return first_segment.trim()
}
