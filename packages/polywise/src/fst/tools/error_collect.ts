import path from 'path'
import { app } from '@core/consts'
import { tool } from 'ai'
import fs from 'fs-extra'
import LineByLine from 'n-readlines'
import { array, enum as Enum, object, string, unknown } from 'zod'

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

		return path.resolve(app.app_path, 'toolcall', `${safe_name}.json`)
	}

	const isError = (output: unknown) => {
		return typeof output === 'object' && output !== null && 'error' in output
	}

	const collectRecord = async (tool_name: string, tool_input: unknown, tool_output: unknown) => {
		const file_path = getToolcallFile(tool_name)

		await fs.ensureDir(path.dirname(file_path))

		await fs.appendFile(file_path, JSON.stringify({ input: tool_input, output: tool_output }) + '\n')

		return {
			action: 'collect',
			tool_name,
			status: isError(tool_output) ? 'error' : 'success'
		}
	}

	const searchRecords = async (tool_name: string, keywords: Array<string>) => {
		const file_path = getToolcallFile(tool_name)

		if (!(await fs.pathExists(file_path))) return { action: 'search', tool_name, records: [], count: 0 }

		const liner = new LineByLine(file_path)
		const matched: Array<RecordEntry> = []
		let line: Buffer | null
		let total_errors = 0

		while ((line = liner.next())) {
			const line_str = line.toString()

			try {
				const record = JSON.parse(line_str) as RecordEntry
				total_errors++

				if (matched.length < 3) {
					const content = JSON.stringify(record).toLowerCase()
					const is_match = keywords.some(k => content.includes(k.toLowerCase()))

					if (is_match) {
						matched.push(record)
					}
				}
			} catch {
				// skip invalid lines
			}
		}

		return {
			action: 'search',
			tool_name,
			records: matched.length > 0 ? matched : [],
			count: total_errors,
			message: matched.length === 0 ? 'No matching records found' : undefined
		}
	}

	return tool({
		description: 'Collect and search tool call error records for debugging when you meet error.',
		inputSchema,
		execute: async args => {
			const { action, tool_name, input, output, keywords } = args

			if (action === 'collect') {
				if (input === undefined || output === undefined)
					return { error: 'input/output required for collect' }
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
