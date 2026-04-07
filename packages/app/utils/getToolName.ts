export default (tool_type: string) => {
	const [_, target] = tool_type.split('-')

	if (!target) return tool_type

	return target.split('_')[0]
}
