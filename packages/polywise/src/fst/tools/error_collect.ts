import path from 'path'
import { app } from '@core/consts'
import { tool } from 'ai'
import fs from 'fs-extra'
import { array, enum as Enum, object, string, unknown } from 'zod'

import { grep } from '../../utils/grep'

type RecordEntry = {
	input: unknown
	output: unknown
}

const inputSchema = object({
	action: Enum(['collect', 'search']).describe('collect: record tool call; search: find errors'),
	tool_name: string().min(1).describe('Name of the tool'),
	input: unknown().optional().describe('Input for collect'),
	output: unknown().optional().describe('Output for collect'),
	keywords: array(string()).optional().describe('Keywords for search')
})

export const createErrorCollectTool = () => {
	const getToolcallFile = (tool_name: string) => {
		const safe_name = tool_name.replace(/[^a-zA-Z0-9_-]/g, '_')

		return path.resolve(app.app_path, 'tool_call_errors', `${safe_name}.jsonl`)
	}

	const collectRecord = async (tool_name: string, tool_input: unknown, tool_output: unknown) => {
		const file_path = getToolcallFile(tool_name)

		await fs.ensureDir(path.dirname(file_path))

		await fs.appendFile(file_path, JSON.stringify({ input: tool_input, output: tool_output }) + '\n')

		return {
			action: 'collect',
			tool_name
		}
	}

	const searchRecords = async (tool_name: string, keywords: Array<string>) => {
		const file_path = getToolcallFile(tool_name)

		if (!(await fs.pathExists(file_path))) return { action: 'search', tool_name, records: [], count: 0 }

		const lines = await grep(file_path, keywords, { max_count: 3 })
		const matched: Array<RecordEntry> = []

		for (const line_str of lines) {
			try {
				const record = JSON.parse(line_str) as RecordEntry
				matched.push(record)
			} catch {}
		}

		return {
			action: 'search',
			tool_name,
			records: matched.length > 0 ? matched : []
		}
	}

	return tool({
		description:
			'Collect after tool call errors and success, search tool call error for debugging when you meet error.',
		inputSchema,
		execute: async args => {
			const { action, tool_name, input, output, keywords } = args

			if (action === 'collect') {
				if (input === undefined || output === undefined) {
					return { error: 'input/output required for collect' }
				}

				return collectRecord(tool_name, input, output)
			}

			if (action === 'search') {
				if (!keywords?.length) return { error: 'keywords required for search' }

				return searchRecords(tool_name, keywords)
			}

			return { error: 'Unknown action' }
		}
	})
}
