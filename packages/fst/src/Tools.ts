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

import { type ToolArgs } from './types'

import type { Tool } from 'ai'

export default (args: ToolArgs): Record<string, Tool> => {
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
			parameters: z.object({
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
			parameters: z.object({
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
			parameters: z.object({
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
			parameters: z.object({
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
			description: 'Fast content search tool that works with any codebase size.',
			parameters: z.object({
				pattern: z.string(),
				path: z.string().optional(),
				glob: z.string().optional(),
				ignore_case: z.boolean().optional(),
				literal: z.boolean().optional(),
				context: z.number().optional(),
				limit: z.number().optional()
			}),
			execute: async ({ pattern, path, glob, ignore_case, literal, context, limit }) => {
				const result = await grep.execute('grep', {
					pattern,
					path,
					glob,
					ignoreCase: ignore_case,
					literal,
					context,
					limit
				})

				if (result.content[0].type === 'text') {
					return result.content[0].text
				}

				return result.content
			}
		}),
		find: tool({
			description: 'Fast file pattern matching tool that works with any codebase size.',
			parameters: z.object({
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
			parameters: z.object({
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
			description: 'Update the structured finite context of the current session.',
			parameters: z.object({
				update: z.record(z.string(), z.unknown())
			}),
			execute: async ({ update }) => {
				sessions.updateContext(update)

				return { success: true, current_context: sessions.getContext() }
			}
		}),
		undo: tool({
			description: 'Undo the last context update.',
			parameters: z.object({}),
			execute: async () => {
				sessions.undo()

				return { success: true, current_context: sessions.getContext() }
			}
		}),
		redo: tool({
			description: 'Redo the last undone context update.',
			parameters: z.object({}),
			execute: async () => {
				sessions.redo()

				return { success: true, current_context: sessions.getContext() }
			}
		}),
		load_reference: tool({
			description: 'Load a reference file, summarize it, and add it to the context.',
			parameters: z.object({
				path: z.string(),
				key: z.string().describe('The key in the context to store the summary under.')
			}),
			execute: async ({ path, key }) => {
				const result = await read.execute('load_reference', { path })

				if (result.content[0].type !== 'text') {
					return { success: false, error: 'Reference is not a text file.' }
				}

				const summary = await summarize(result.content[0].text)

				sessions.updateContext({ [key]: summary })

				return { success: true, summary, current_context: sessions.getContext() }
			}
		})
	}
}
