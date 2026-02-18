import 'reflect-metadata'

import path from 'path'
import { tool } from '@opencode-ai/plugin'
import to from 'await-to-js'
import { Polywise } from 'polywise'
import { container } from 'tsyringe'

import { getLastAIMessages, getMetadata, getQa, getTextPart, tool_desc } from './utils'

import type { Plugin } from '@opencode-ai/plugin'

export const version = '0.0.1'

const tool_args = {
	action: tool.schema.enum(['query', 'save', 'update', 'forget']).describe('operation type'),
	query: tool.schema.string().optional().describe('query memory keyword'),
	content: tool.schema.string().optional().describe('memory content to be saved or updated'),
	memory_id: tool.schema.string().optional().describe('unique ID of memory entry')
}

export const OpencodePlugin: Plugin = async ctx => {
	const { project, directory } = ctx
	const project_id = project.id

	const poly = container.resolve(Polywise)

	await poly.init({
		data_dir: path.join(directory, '.polywise'),
		metrics_ids: [project_id]
	})

	return {
		tool: {
			polywise: tool({
				description: tool_desc,
				args: tool_args,
				async execute(args: {
					action: 'query' | 'save' | 'update' | 'forget'
					query?: string
					content?: string
					memory_id?: string
				}) {
					const { action, query, content, memory_id } = args

					switch (action) {
						case 'save': {
							if (!content) {
								return JSON.stringify({
									success: false,
									error: 'content parameter is required for save action'
								})
							}

							const [err, res] = await to(poly.save({ metrics_ids: [project_id], content }))

							if (err) {
								console.log('[PolywisePlugin] save memory err: ', JSON.stringify(err))
								console.log('--------------')

								return JSON.stringify({
									success: false,
									error: err?.message || 'Failed to save memory'
								})
							}

							console.log('[PolywisePlugin] save memory: ', JSON.stringify(res))
							console.log('--------------')

							return JSON.stringify({ success: true, memory_id: res })
						}

						case 'query': {
							if (!query) {
								return JSON.stringify({
									success: false,
									error: 'query parameter is required for query action'
								})
							}

							const [err, res] = await to(
								poly.query({
									metrics_ids: [project_id],
									query
								})
							)

							if (err) {
								return JSON.stringify({
									success: false,
									error: err?.message || 'Failed to query memory'
								})
							}

							const { memory } = res

							console.log('[PolywisePlugin] query: ', query)
							console.log('[PolywisePlugin] memory find: ', JSON.stringify(res))
							console.log('--------------')

							let targets = ''

							if (memory.length > 0) {
								targets += `Related Memory: \n${JSON.stringify(memory)}\n`
							}

							return JSON.stringify({ success: true, memory: targets })
						}

						case 'update': {
							if (!content) {
								return JSON.stringify({
									success: false,
									error: 'content parameter is required for update action'
								})
							}

							if (!memory_id) {
								return JSON.stringify({
									success: false,
									error: 'memory_id parameter is required for update action'
								})
							}

							const [err, res] = await to(
								poly.update({
									metrics_ids: [project_id],
									memory_id: memory_id,
									content
								})
							)

							if (err) {
								return JSON.stringify({
									success: false,
									error: err?.message || 'Failed to update memory'
								})
							}

							console.log('[PolywisePlugin] update memory: ', JSON.stringify(content))
							console.log('[PolywisePlugin] update memory id: ', memory_id)
							console.log('--------------')

							return JSON.stringify({ success: true, memory_id: res })
						}

						case 'forget': {
							if (!memory_id) {
								return JSON.stringify({
									success: false,
									error: 'memory_id parameter is required for forget action'
								})
							}

							const [err] = await to(
								poly.forget({
									metrics_ids: [project_id],
									memory_id: memory_id
								})
							)

							if (err) {
								return JSON.stringify({
									success: false,
									error: err?.message || 'Failed to forget memory'
								})
							}

							console.log('[PolywisePlugin] forget memory id: ', memory_id)
							console.log('--------------')

							return JSON.stringify({ success: true, memory_id: memory_id })
						}
					}
				}
			})
		},
		event: async ({ event }) => {
			if (event.type === 'session.idle') {
				const id = event.properties.sessionID

				const { error, data } = await ctx.client.session.messages({
					path: { id },
					query: { limit: 10 }
				})

				if (error) return console.error(error)

				const ai_response = getTextPart(data.at(-1).parts)

				if (!ai_response.trim()) return

				const { user_prompt, ai_messages } = getLastAIMessages(data)
				const metadata = getMetadata(ai_messages)
				const others = {}

				console.log('--------------')
				console.log('AI Response: ', ai_response)
				console.log('Metadata: ', JSON.stringify(metadata))
				console.log('--------------')

				if (metadata) others['metadata'] = metadata

				const [err] = await to(
					poly.save({
						metrics_ids: [project_id],
						content: getQa(user_prompt, ai_response),
						...others
					})
				)

				if (err) console.error(err?.message)
			}
		}
	}
}
