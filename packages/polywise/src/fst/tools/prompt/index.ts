import { tool } from 'ai'
import { enum as Enum, number, object, string } from 'zod'

import { readPromptContent, readPromptMap, rebuildPromptMap, writePromptFile } from './runtime'
import search from './search'

import type Session from '../../session'

const positiveIntField = number().int().positive()

const inputSchema = object({
	action: Enum(['search', 'read', 'create', 'update', 'build']).describe(
		'The action to perform. search: fuzzy search prompt files by path or summary. read: read a prompt file fully or by line range. create: write a new allowed prompt file. update: overwrite an existing prompt file. build: rescan prompt files and rebuild the local prompt_map cache.'
	),
	keyword: string()
		.optional()
		.describe('[Required for search] Keyword to match against prompt file paths, kinds, and summaries'),
	prompt_path: string()
		.optional()
		.describe('[Required for read/create/update] Exact prompt file path, such as CLAUDE.md or .agent/foo.md'),
	start_line: positiveIntField
		.optional()
		.describe('[Optional for read] 1-based start line for partial reads. Defaults to 1'),
	end_line: positiveIntField
		.optional()
		.describe('[Optional for read] 1-based end line for partial reads. Defaults to the end of the file'),
	content: string()
		.optional()
		.describe('[Required for create/update] Full file content to write to the prompt file'),
	max_results: positiveIntField
		.optional()
		.describe('[Only for search] Maximum number of results to return (default 5)')
})

export { buildPromptInjectionPrompt, readPromptContent, readPromptMap, rebuildPromptMap } from './runtime'

export const createPromptTool = (s: Session) => {
	return tool({
		description: [
			'Inspect workspace prompt files discovered under the current session prompt root.',
			'The scan covers CLAUDE.md, AGENT.md, and Markdown files under .agent/.',
			'Use search to discover available prompt files by path, kind, or summary.',
			'Use read with prompt_path to inspect a prompt file, optionally limited to a line range.',
			'Use create or update to manage prompt files directly when prompt authoring is intended.',
			'Use build to force a rescan and refresh the cached prompt_map when needed.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'search') {
				if (!input.keyword) {
					return { action: 'search', error: 'keyword is required for search action' }
				}

				const prompt_map = await readPromptMap(s)
				const results = search(prompt_map, input.keyword, input.max_results ?? 5)

				return {
					action: 'search',
					count: results.length,
					results: results.map(item => ({
						path: item.path,
						kind: item.kind,
						summary: item.summary,
						line_count: item.line_count,
						score: item.score
					}))
				}
			}

			if (input.action === 'read') {
				if (!input.prompt_path) {
					return { action: 'read', error: 'prompt_path is required for read action' }
				}

				const res = await readPromptContent(s, input.prompt_path, {
					start_line: input.start_line,
					end_line: input.end_line
				})

				if ('error' in res) {
					return {
						action: 'read',
						prompt_path: input.prompt_path,
						error: res.error
					}
				}

				return {
					action: 'read',
					prompt_path: res.prompt.path,
					kind: res.prompt.kind,
					summary: res.prompt.summary,
					hash: res.prompt.hash,
					start_line: res.start_line,
					end_line: res.end_line,
					total_lines: res.total_lines,
					content: res.content
				}
			}

			if (input.action === 'create') {
				if (!input.prompt_path) {
					return { action: 'create', error: 'prompt_path is required for create action' }
				}

				if (input.content === undefined) {
					return { action: 'create', error: 'content is required for create action' }
				}

				const res = await writePromptFile({
					session: s,
					prompt_path: input.prompt_path,
					content: input.content,
					require_existing: false
				})

				if ('error' in res) {
					return {
						action: 'create',
						prompt_path: input.prompt_path,
						error: res.error
					}
				}

				return {
					action: 'create',
					prompt_path: res.prompt?.path ?? input.prompt_path,
					prompt: res.prompt,
					count: res.count
				}
			}

			if (input.action === 'update') {
				if (!input.prompt_path) {
					return { action: 'update', error: 'prompt_path is required for update action' }
				}

				if (input.content === undefined) {
					return { action: 'update', error: 'content is required for update action' }
				}

				const res = await writePromptFile({
					session: s,
					prompt_path: input.prompt_path,
					content: input.content,
					require_existing: true
				})

				if ('error' in res) {
					return {
						action: 'update',
						prompt_path: input.prompt_path,
						error: res.error
					}
				}

				return {
					action: 'update',
					prompt_path: res.prompt?.path ?? input.prompt_path,
					prompt: res.prompt,
					count: res.count
				}
			}

			if (input.action === 'build') {
				const prompt_map = await rebuildPromptMap(s)

				return {
					action: 'build',
					count: prompt_map.length,
					prompts: prompt_map.map(item => ({
						path: item.path,
						kind: item.kind,
						hash: item.hash
					}))
				}
			}

			return { error: 'Unknown action' }
		}
	})
}
