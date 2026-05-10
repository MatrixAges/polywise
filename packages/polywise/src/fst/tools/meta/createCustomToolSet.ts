import path from 'path'
import { tool } from 'ai'
import { z } from 'zod'

import readSchemas, { loadCustomToolModule, validateSchemaValue } from './readSchemas'

import type Session from '../../session'
import type { JsonSchema } from './readSchemas'

export const executeCustomTool = async (tool_path: string, input: unknown, s: Session) => {
	const { input_schema, output_schema, module } = await loadCustomToolModule(tool_path)
	const execute = module.default

	if (typeof execute !== 'function') {
		return { error: 'Custom tool must default export a function' }
	}

	const validated_input = validateSchemaValue(input_schema, input, 'input_schema')
	const result = await execute(validated_input, s)

	return validateSchemaValue(output_schema, result, 'output_schema')
}

const createExecute = (s: Session, tool_path: string) => {
	return async (input: unknown) => {
		return executeCustomTool(tool_path, input, s)
	}
}

const getSchema = (schema?: JsonSchema) => {
	if (!schema) {
		return z.record(z.string(), z.unknown())
	}

	return z.fromJSONSchema(schema)
}

export default async (s: Session) => {
	const custom_tools = await Promise.all(
		s.custom_tools_map.map(async custom_tool => {
			const tool_path = path.resolve(s.tools_dir, custom_tool.name, 'index.mjs')
			const { input_schema, output_schema } = await readSchemas(tool_path)

			return [
				custom_tool.name,
				tool({
					description: custom_tool.description,
					inputSchema: getSchema(input_schema),
					outputSchema: output_schema ? getSchema(output_schema) : undefined,
					execute: createExecute(s, tool_path)
				})
			] as const
		})
	)

	return Object.fromEntries(custom_tools)
}
