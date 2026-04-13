export default (tool_name: string) => {
	if (process.platform === 'win32') {
		return {
			command: 'where',
			args: [tool_name]
		}
	}

	return {
		command: 'command',
		args: ['-v', tool_name]
	}
}
