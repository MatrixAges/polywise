import path from 'path'
import { tool } from 'ai'
import { readFile, writeFile } from 'atomically'
import fs from 'fs-extra'
import { enum as Enum, number, object, string } from 'zod'

import { executeCustomTool } from './createCustomToolSet'
import getToolDir from './getToolDir'
import readCustomToolsMap from './read'
import readInputSchema from './readInputSchema'
import rebuildCustomToolsMap from './rebuild'
import search from './search'

import type Session from '../../session'

const inputSchemaField = string()
	.optional()
	.describe('[Optional for create] JSON Schema string exported as input_schema for the custom tool')

export { default as createCustomToolSet } from './createCustomToolSet'
export { default as getCustomToolsPrompt } from '@core/consts/prompts/getCustomToolsPrompt'
export { default as loadCustomToolsMap } from './load'
export { default as readCustomToolsMap } from './read'
export { default as rebuildCustomToolsMap } from './rebuild'
export { default as scanCustomToolsMap } from './scan'

const inputSchema = object({
	action: Enum(['create', 'remove', 'list', 'read', 'search', 'execute', 'build']).describe(
		'The action to perform. create: create a custom tool. remove: delete one. list: list all. read: inspect one. search: fuzzy find by keyword. execute: route and run a custom tool. build: rebuild custom_tools_map.'
	),
	tool_name: string().optional().describe('[Required for create/remove/read/execute] Custom tool name'),
	keyword: string().optional().describe('[Required for search] Keyword to search custom tools'),
	description: string()
		.optional()
		.describe('[Required for create] Short tool description stored in readme.md metadata'),
	input_schema: inputSchemaField,
	execute_input: string()
		.optional()
		.describe('[Optional for execute] JSON string passed to the target custom tool as input'),
	readme: string()
		.optional()
		.describe('[Optional for create] Full readme.md content to override the default template'),
	entry: string()
		.optional()
		.describe('[Optional for create] Full index.mjs content to override the default template'),
	max_results: number().optional().describe('[Only for search] Maximum results to return (default 5)')
})

const parseExecuteInput = (value?: string) => {
	if (!value?.trim()) {
		return {}
	}

	try {
		return JSON.parse(value) as unknown
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Invalid JSON'

		throw new Error(`execute_input must be valid JSON: ${message}`)
	}
}

const parseInputSchema = (value?: string) => {
	if (!value?.trim()) {
		return undefined
	}

	try {
		const json_schema = JSON.parse(value) as unknown

		if (!json_schema || typeof json_schema !== 'object' || Array.isArray(json_schema)) {
			throw new Error('input_schema must be a JSON object')
		}

		return json_schema
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Invalid JSON'

		throw new Error(`input_schema must be valid JSON Schema: ${message}`)
	}
}

const getDefaultReadme = (tool_name: string, description: string) => {
	return [
		'---',
		`name: ${tool_name}`,
		`description: ${description}`,
		'---',
		'',
		'# Usage',
		'',
		'Describe what this custom tool does and how the model should use it.'
	].join('\n')
}

const getDefaultEntry = (input_schema?: unknown) => {
	const schema_content = JSON.stringify(
		input_schema ?? { type: 'object', properties: {}, additionalProperties: true },
		null,
		4
	)

	return [
		`export const input_schema = ${schema_content}`,
		'',
		'export default async (input, s) => {',
		'\treturn {',
		"\t\tmessage: 'Custom tool template executed',",
		'\t\tinput,',
		'\t\tsession_id: s.id',
		'\t}',
		'}'
	].join('\n')
}

const getToolPath = (tools_dir: string, tool_name: string) => {
	return path.resolve(getToolDir(tools_dir, tool_name), 'index.mjs')
}

const getToolReadmePath = (tools_dir: string, tool_name: string) => {
	return path.resolve(getToolDir(tools_dir, tool_name), 'readme.md')
}

export const createMetaTool = (s: Session) => {
	return tool({
		description: [
			'Custom tools are not exposed as direct callable tools in the main tool registry.',
			'Use search to fuzzy-match available custom tools by keyword.',
			'Use read to inspect a custom tool readme and metadata before execution.',
			'Use execute to route through meta_tool and run a specific custom tool by name.',
			'Use create, remove, and build to maintain the custom_tools_map routing layer for lazily loaded custom tools.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'create') {
				if (!input.tool_name)
					return { action: 'create', error: 'tool_name is required for create action' }
				if (!input.description)
					return { action: 'create', error: 'description is required for create action' }

				let input_schema = undefined as unknown

				let target_dir = ''

				try {
					input_schema = parseInputSchema(input.input_schema)
					target_dir = getToolDir(s.tools_dir, input.tool_name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'create', error: message }
				}

				const exists = await fs.pathExists(target_dir)

				if (exists) {
					return { action: 'create', error: `Custom tool "${input.tool_name}" already exists` }
				}

				const readme_path = path.resolve(target_dir, 'readme.md')
				const tool_path = path.resolve(target_dir, 'index.mjs')
				const readme_content = input.readme ?? getDefaultReadme(input.tool_name, input.description)
				const entry_content = input.entry ?? getDefaultEntry(input_schema)

				await fs.ensureDir(target_dir)
				await writeFile(readme_path, readme_content, 'utf8')
				await writeFile(tool_path, entry_content, 'utf8')

				const custom_tools_map = await rebuildCustomToolsMap(s)

				return {
					action: 'create',
					tool_name: input.tool_name,
					count: custom_tools_map.length
				}
			}

			if (input.action === 'remove') {
				if (!input.tool_name)
					return { action: 'remove', error: 'tool_name is required for remove action' }

				let target_dir = ''

				try {
					target_dir = getToolDir(s.tools_dir, input.tool_name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'remove', error: message }
				}

				const exists = await fs.pathExists(target_dir)

				if (!exists) {
					return { action: 'remove', error: `Custom tool "${input.tool_name}" not found` }
				}

				await fs.remove(target_dir)

				const custom_tools_map = await rebuildCustomToolsMap(s)

				return {
					action: 'remove',
					tool_name: input.tool_name,
					count: custom_tools_map.length
				}
			}

			if (input.action === 'list') {
				const custom_tools_map = await readCustomToolsMap(s)

				return {
					action: 'list',
					count: custom_tools_map.length,
					tools: custom_tools_map.map(custom_tool => ({
						name: custom_tool.name,
						description: custom_tool.description
					}))
				}
			}

			if (input.action === 'read') {
				if (!input.tool_name) return { action: 'read', error: 'tool_name is required for read action' }

				const custom_tools_map = await readCustomToolsMap(s)
				const target = custom_tools_map.find(custom_tool => custom_tool.name === input.tool_name)

				if (!target) {
					return {
						action: 'read',
						tool_name: input.tool_name,
						error: `Custom tool "${input.tool_name}" not found. Use action "search" to find available tools.`
					}
				}

				const readme_path = getToolReadmePath(s.tools_dir, target.name)
				const tool_path = getToolPath(s.tools_dir, target.name)
				const readme = await readFile(readme_path, 'utf8')
				const input_schema = await readInputSchema(tool_path)

				return {
					action: 'read',
					tool_name: target.name,
					description: target.description,
					input_schema,
					readme
				}
			}

			if (input.action === 'search') {
				if (!input.keyword) {
					return { action: 'search', error: 'keyword is required for search action' }
				}

				const max_results = input.max_results ?? 5
				const custom_tools_map = await readCustomToolsMap(s)
				const results = search(custom_tools_map, input.keyword, max_results)
				const results_with_schema = await Promise.all(
					results.map(async custom_tool => ({
						name: custom_tool.name,
						description: custom_tool.description,
						input_schema: await readInputSchema(getToolPath(s.tools_dir, custom_tool.name)),
						score: custom_tool.score
					}))
				)

				return {
					action: 'search',
					keyword: input.keyword,
					count: results_with_schema.length,
					results: results_with_schema
				}
			}

			if (input.action === 'execute') {
				if (!input.tool_name)
					return { action: 'execute', error: 'tool_name is required for execute action' }

				const custom_tools_map = await readCustomToolsMap(s)
				const target = custom_tools_map.find(custom_tool => custom_tool.name === input.tool_name)

				if (!target) {
					return {
						action: 'execute',
						tool_name: input.tool_name,
						error: `Custom tool "${input.tool_name}" not found. Use action "search" to find available tools.`
					}
				}

				try {
					const execute_input = parseExecuteInput(input.execute_input)
					const tool_path = getToolPath(s.tools_dir, target.name)
					const result = await executeCustomTool(tool_path, execute_input, s)

					return {
						action: 'execute',
						tool_name: target.name,
						description: target.description,
						input: execute_input,
						result
					}
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Custom tool execution failed'

					return {
						action: 'execute',
						tool_name: target.name,
						error: message
					}
				}
			}

			if (input.action === 'build') {
				const custom_tools_map = await rebuildCustomToolsMap(s)

				return {
					action: 'build',
					count: custom_tools_map.length,
					tools: custom_tools_map.map(custom_tool => custom_tool.name)
				}
			}

			return { error: 'Unknown action' }
		}
	})
}
