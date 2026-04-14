import path from 'path'
import { app } from '@core/consts'
import { tool } from 'ai'
import fs from 'fs-extra'
import { array, enum as Enum, object, string, unknown } from 'zod'

type RecordEntry = {
	input: unknown
	output: unknown
}

type ToolData = {
	tool_name: string
	errors: Array<RecordEntry>
	success: RecordEntry | null
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

		let data: ToolData = { tool_name, errors: [], success: null }

		if (await fs.pathExists(file_path)) {
			data = await fs.readJson(file_path).catch(() => data)
		}

		if (!isError(tool_output)) {
			data.success = { input: tool_input, output: tool_output }
		} else {
			const input_str = JSON.stringify(tool_input)
			const is_dup = data.errors.some(e => JSON.stringify(e.input) === input_str)

			if (!is_dup) data.errors.push({ input: tool_input, output: tool_output })
		}

		await fs.writeJson(file_path, data, { spaces: 2 })

		return {
			action: 'collect',
			tool_name,
			status: isError(tool_output) ? 'error' : 'success',
			error_count: data.errors.length
		}
	}

	const searchRecords = async (tool_name: string, keywords: Array<string>) => {
		const file_path = getToolcallFile(tool_name)

		if (!(await fs.pathExists(file_path))) return { action: 'search', tool_name, records: [], count: 0 }

		const data: ToolData = await fs.readJson(file_path).catch(() => ({ tool_name, errors: [], success: null }))

		const matched = data.errors
			.filter(err => {
				const content = JSON.stringify(err).toLowerCase()
				return keywords.some(k => content.includes(k.toLowerCase()))
			})
			.slice(0, 3)

		return {
			action: 'search',
			tool_name,
			records: matched.length > 0 ? matched : data.errors.slice(0, 3),
			count: data.errors.length,
			message: matched.length > 0 ? undefined : 'No keyword matches, returning latest errors'
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
