import path from 'path'
import { tool } from 'ai'
import { z } from 'zod'

import readInputSchema from './readInputSchema'

import type Session from '../../session'

type JsonSchema = Parameters<typeof z.fromJSONSchema>[0]

export const executeCustomTool = async (tool_path: string, input: unknown, s: Session) => {
	const target_module = await import(`file://${tool_path}`)
	const execute = target_module.default

	if (typeof execute !== 'function') {
		return { error: 'Custom tool must default export a function' }
	}

	return execute(input, s)
}

const createExecute = (s: Session, tool_path: string) => {
	return async (input: unknown) => {
		return executeCustomTool(tool_path, input, s)
	}
}

const getInputSchema = (input_schema?: JsonSchema) => {
	if (!input_schema) {
		return z.record(z.string(), z.unknown())
	}

	return z.fromJSONSchema(input_schema)
}

export default async (s: Session) => {
	const custom_tools = await Promise.all(
		s.custom_tools_map.map(async custom_tool => {
			const tool_path = path.resolve(s.tools_dir, custom_tool.name, 'index.mjs')
			const input_schema = (await readInputSchema(tool_path)) as JsonSchema | undefined

			return [
				custom_tool.name,
				tool({
					description: custom_tool.description,
					inputSchema: getInputSchema(input_schema),
					execute: createExecute(s, tool_path)
				})
			] as const
		})
	)

	return Object.fromEntries(custom_tools)
}
