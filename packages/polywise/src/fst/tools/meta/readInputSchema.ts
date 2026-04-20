const getInputSchema = async (tool_path: string) => {
	const target_module = await import(`file://${tool_path}`)

	return target_module.input_schema as unknown
}

export default getInputSchema
