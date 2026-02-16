import { resolve } from 'path'
import {
	createBashTool,
	createEditTool,
	createFindTool,
	createGrepTool,
	createLsTool,
	createReadTool,
	createWriteTool
} from '@mariozechner/pi-coding-agent'
import { tool } from 'ai'
import { z } from 'zod'

import { ShadowContextSchema } from './types/shadow'

import type { Tool } from 'ai'
import type { ToolArgs } from './types'

export type Tools = Record<
	| 'read'
	| 'bash'
	| 'edit'
	| 'write'
	| 'grep'
	| 'find'
	| 'ls'
	| 'update_context'
	| 'undo'
	| 'redo'
	| 'load_reference',
	Tool
>

export default (args: ToolArgs): Tools => {
	const { cwd, sessions, summarize } = args

	const read = createReadTool(cwd)
	const bash = createBashTool(cwd)
	const edit = createEditTool(cwd)
	const write = createWriteTool(cwd)
	const grep = createGrepTool(cwd)
	const find = createFindTool(cwd)
	const ls = createLsTool(cwd)

	return {
		read: tool({
			description: 'Read a file or directory from the local filesystem.',
			inputSchema: z.object({
				path: z.string(),
				offset: z.number().optional(),
				limit: z.number().optional()
			}),
			execute: async args => {
				const result = await read.execute('read', args)

				if (result.content[0].type === 'text') {
					return result.content[0].text
				}

				return result.content
			}
		}),
		bash: tool({
			description: 'Executes a given bash command in a persistent shell session.',
			inputSchema: z.object({
				command: z.string(),
				timeout: z.number().optional()
			}),
			execute: async args => {
				const result = await bash.execute('bash', args)

				if (result.content[0].type === 'text') {
					return result.content[0].text
				}

				return result.content
			}
		}),
		edit: tool({
			description: 'Performs exact string replacements in files.',
			inputSchema: z.object({
				path: z.string(),
				old_text: z.string(),
				new_text: z.string()
			}),
			execute: async ({ path, old_text, new_text }) => {
				const result = await edit.execute('edit', { path, oldText: old_text, newText: new_text })

				if (result.content[0].type === 'text') {
					return result.content[0].text
				}

				return result.content
			}
		}),
		write: tool({
			description: 'Writes a file to the local filesystem.',
			inputSchema: z.object({
				path: z.string(),
				content: z.string()
			}),
			execute: async args => {
				const result = await write.execute('write', args)

				if (result.content[0].type === 'text') {
					return result.content[0].text
				}

				return result.content
			}
		}),
		grep: tool({
			description:
				'Search for a pattern in a file or directory using grep/ripgrep. Returns matching lines and file paths.',
			inputSchema: z.object({
				pattern: z.string().describe('The regular expression pattern to search for'),
				path: z
					.string()
					.optional()
					.describe('The directory or file to search in. Defaults to current working directory.'),
				glob: z.string().optional().describe('Glob pattern to filter files (e.g., "*.ts")'),
				ignore_case: z.boolean().optional().describe('Whether to ignore case'),
				literal: z.boolean().optional(),
				context: z.number().optional(),
				limit: z.number().optional()
			}),
			execute: async ({ pattern, path, glob, ignore_case, literal, context, limit }) => {
				const targetPath = path ? resolve(cwd, path) : cwd

				try {
					const result = await grep.execute('grep', {
						pattern,
						path: targetPath,
						glob,
						ignoreCase: ignore_case,
						literal,
						context,
						limit
					})

					if (result.content[0].type === 'text') {
						return result.content[0].text
					}
					return JSON.stringify(result.content)
				} catch (error: any) {
					return `Grep failed: ${error.message}`
				}
			}
		}),
		find: tool({
			description: 'Fast file pattern matching tool that works with any codebase size.',
			inputSchema: z.object({
				pattern: z.string(),
				path: z.string().optional(),
				limit: z.number().optional()
			}),
			execute: async args => {
				const result = await find.execute('find', args)

				if (result.content[0].type === 'text') {
					return result.content[0].text
				}

				return result.content
			}
		}),
		ls: tool({
			description: 'Lists files in a directory.',
			inputSchema: z.object({
				path: z.string().optional(),
				limit: z.number().optional()
			}),
			execute: async args => {
				const result = await ls.execute('ls', args)

				if (result.content[0].type === 'text') {
					return result.content[0].text
				}

				return result.content
			}
		}),
		update_context: tool({
			description: 'Update the shadow context of the current session.',
			inputSchema: z.object({
				update: ShadowContextSchema.partial()
			}),
			execute: async ({ update }) => {
				await sessions.updateShadowContext(update)
				return { success: true, current_context: sessions.getShadowContext() }
			}
		}),
		undo: tool({
			description: 'Undo the last context update.',
			inputSchema: z.object({}),
			execute: async () => {
				sessions.undo()
				return { success: true, current_context: sessions.getShadowContext() }
			}
		}),
		redo: tool({
			description: 'Redo the last undone context update.',
			inputSchema: z.object({}),
			execute: async () => {
				sessions.redo()
				return { success: true, current_context: sessions.getShadowContext() }
			}
		}),
		load_reference: tool({
			description: 'Load a reference file, summarize it, and add it to the context.',
			inputSchema: z.object({
				path: z.string(),
				key: z.string().describe('The key in the context to store the summary under.')
			}),
			execute: async ({ path: refPath, key }) => {
				const result = await read.execute('read', { path: refPath })

				if (result.content[0].type !== 'text') {
					return { success: false, error: 'Reference is not a text file.' }
				}

				const summary = await summarize(result.content[0].text)
				await sessions.updateShadowContext({
					context: `${sessions.getShadowContext().context}\n${key}: ${summary}`
				})

				return { success: true, summary, current_context: sessions.getShadowContext() }
			}
		})
	}
}
