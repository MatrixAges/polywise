import { createFindTool, createGrepTool, createLsTool, createReadTool } from '@mariozechner/pi-coding-agent'
import { tool } from 'ai'
import { z } from 'zod'

import { ShadowContextSchema } from './types/shadow'

import type { Tool } from 'ai'
import type { ToolArgs } from './types'

export default (args: ToolArgs): Record<string, Tool> => {
	const { cwd, sessions } = args

	const read = createReadTool(cwd)
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
		grep: tool({
			description: 'Fast content search tool that works with any codebase size.',
			inputSchema: z.object({
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
		})
	}
}
