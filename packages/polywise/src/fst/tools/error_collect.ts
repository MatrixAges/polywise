import path from 'path'
import { app } from '@core/consts'
import { tool } from 'ai'
import fs from 'fs-extra'
import { array, enum as Enum, object, string, unknown } from 'zod'

import grep from '../../utils/grep'
import { collectFailureEvent, getToolErrorFile } from '../telemetry'

type RecordEntry = {
	input: unknown
	output: unknown
}

const inputSchema = object({
	action: Enum(['collect', 'search']).describe('collect: record tool call; search: find errors'),
	tool_name: string().min(1).describe('Name of the tool'),
	input: unknown().optional().describe('Input for collect'),
	output: unknown().optional().describe('Output for collect'),
	keywords: array(string()).optional().describe('Keywords for search or patch aggregation'),
	session_id: string().optional().describe('Session id for patch aggregation'),
	target: string().optional().describe('Target summary for patch aggregation'),
	has_existing_skill: string()
		.optional()
		.describe('Use "true" when an existing skill already matches the failure pattern')
})

export const createErrorCollectTool = () => {
	const getToolcallFile = (tool_name: string) => getToolErrorFile({ app_path: app.app_path, tool_name })

	const collectRecord = async (args: {
		tool_name: string
		tool_input: unknown
		tool_output: unknown
		keywords?: Array<string>
		session_id?: string
		target?: string
		has_existing_skill?: boolean
	}) => {
		const { tool_name, tool_input, tool_output, keywords, session_id, target, has_existing_skill } = args
		const file_path = getToolcallFile(tool_name)

		await fs.ensureDir(path.dirname(file_path))

		await fs.appendFile(file_path, JSON.stringify({ input: tool_input, output: tool_output }) + '\n')

		const output_text = typeof tool_output === 'string' ? tool_output : JSON.stringify(tool_output)
		const should_collect_patch =
			Boolean(session_id && target) && /error|fail|denied|invalid|timeout/i.test(output_text)
		let patch = null

		if (should_collect_patch) {
			patch = await collectFailureEvent({
				app_path: app.app_path,
				session_id: session_id as string,
				tool_name,
				target: target as string,
				error_text: output_text,
				keywords: keywords || [],
				has_existing_skill
			})
		}

		return {
			action: 'collect',
			tool_name,
			patch
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
			const { action, tool_name, input, output, keywords, session_id, target, has_existing_skill } = args

			if (action === 'collect') {
				if (input === undefined || output === undefined) {
					return { error: 'input/output required for collect' }
				}

				return collectRecord({
					tool_name,
					tool_input: input,
					tool_output: output,
					keywords,
					session_id,
					target,
					has_existing_skill: has_existing_skill === 'true'
				})
			}

			if (action === 'search') {
				if (!keywords?.length) return { error: 'keywords required for search' }

				return searchRecords(tool_name, keywords)
			}

			return { error: 'Unknown action' }
		}
	})
}
