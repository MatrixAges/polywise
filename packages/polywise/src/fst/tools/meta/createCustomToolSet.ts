import { tool } from 'ai'
import { z } from 'zod'

import type Session from '../../session'

export const executeCustomTool = async (tool_path: string, input: unknown, s: Session) => {
	const target_module = await import(`file://${tool_path}`)
	const execute = target_module.default

	if (typeof execute !== 'function') {
		return { error: `Custom tool at ${tool_path} must default export a function` }
	}

	return execute(input, s)
}

const createExecute = (s: Session, tool_path: string) => {
	return async (input: unknown) => {
		return executeCustomTool(tool_path, input, s)
	}
}

export default (s: Session) => {
	return Object.fromEntries(
		s.custom_tools_map.map(custom_tool => [
			custom_tool.name,
			tool({
				description: custom_tool.description,
				inputSchema: z.record(z.string(), z.unknown()),
				execute: createExecute(s, custom_tool.path)
			})
		])
	)
}
