import path from 'path'
import { tool } from '@opencode-ai/plugin'
import to from 'await-to-js'
import { Polywise } from 'polywise'
import { container } from 'tsyringe'

import { getLastAIMessages, getMetadata, getQa, getTextPart } from './utils'

import type { Plugin } from '@opencode-ai/plugin'
import type { TextPart } from '@opencode-ai/sdk'

const Index: Plugin = async ctx => {
	const { project, directory } = ctx
	const project_id = project.id

	const poly = container.resolve(Polywise)

	await poly.init({
		data_dir: path.join(directory, '.polywise'),
		metrics_ids: [project_id]
	})

	return {
		'chat.message': async (input, output) => {
			const raw_query = getTextPart(output.parts)
			const query = raw_query.slice(0, 300)

			const [err, res] = await to(
				poly.query({
					metrics_ids: [project_id],
					query
				})
			)

			if (err) return console.error(err.message)

			const { memory, metadata } = res

			console.log('--------------')
			console.log('[PolywisePlugin] query: ', query)
			console.log('[PolywisePlugin] memory find: ', JSON.stringify(res))
			console.log('--------------')

			const common = {
				sessionID: input.sessionID,
				messageID: output.message.id,
				type: 'text',
				synthetic: true
			} as TextPart

			if (memory.length > 0) {
				output.parts.push({
					...common,
					id: `polywise-memory-${Date.now()}`,
					text: `Related Memory: ${JSON.stringify(memory)}`
				})
			}

			if (metadata && (metadata.desc || metadata.files?.length || metadata.links?.length)) {
				output.parts.push({
					...common,
					id: `polywise-metadata-${Date.now()}`,
					text: `Related Metadata: ${JSON.stringify(metadata)}`
				})
			}
		},
		tool: {
			tool: {
				supermemory: tool({
					description:
						"Manage and query the Polywise persistent memory system. Use 'query' to find relevant memories, 'save' to store new memory",
					args: {
						action: tool.schema.enum(['save', 'query']),
						query: tool.schema.string().optional(),
						content: tool.schema.string().optional(),
						memory_id: tool.schema.string().optional()
					},
					async execute(args: { action: 'query' | 'save'; query?: string; content?: string }) {
						const { action, query, content } = args

						try {
							switch (action) {
								case 'save': {
									if (!content) {
										return JSON.stringify({
											success: false,
											error: 'content parameter is required'
										})
									}

									const [err, res] = await to(
										poly.save({ metrics_ids: [project_id], content })
									)

									if (!err) {
										return JSON.stringify({
											success: false,
											error: err.message || 'Failed to save memory'
										})
									}

									return JSON.stringify({ success: true })
								}

								case 'query': {
									if (!args.query) {
										return JSON.stringify({
											success: false,
											error: 'query parameter is required for search mode'
										})
									}

									const scope = args.scope

									if (scope === 'user') {
										const result = await supermemoryClient.searchMemories(
											args.query,
											tags.user
										)
										if (!result.success) {
											return JSON.stringify({
												success: false,
												error:
													result.error ||
													'Failed to search memories'
											})
										}
										return formatSearchResults(
											args.query,
											scope,
											result,
											args.limit
										)
									}

									if (scope === 'project') {
										const result = await supermemoryClient.searchMemories(
											args.query,
											tags.project
										)
										if (!result.success) {
											return JSON.stringify({
												success: false,
												error:
													result.error ||
													'Failed to search memories'
											})
										}
										return formatSearchResults(
											args.query,
											scope,
											result,
											args.limit
										)
									}

									const [userResult, projectResult] = await Promise.all([
										supermemoryClient.searchMemories(args.query, tags.user),
										supermemoryClient.searchMemories(args.query, tags.project)
									])

									if (!userResult.success || !projectResult.success) {
										return JSON.stringify({
											success: false,
											error:
												userResult.error ||
												projectResult.error ||
												'Failed to search memories'
										})
									}

									const combined = [
										...(userResult.results || []).map(r => ({
											...r,
											scope: 'user' as const
										})),
										...(projectResult.results || []).map(r => ({
											...r,
											scope: 'project' as const
										}))
									].sort((a, b) => b.similarity - a.similarity)

									return JSON.stringify({
										success: true,
										query: args.query,
										count: combined.length,
										results: combined.slice(0, args.limit || 10).map(r => ({
											id: r.id,
											content: r.memory || r.chunk,
											similarity: Math.round(r.similarity * 100),
											scope: r.scope
										}))
									})
								}

								case 'forget': {
									if (!args.memoryId) {
										return JSON.stringify({
											success: false,
											error: 'memoryId parameter is required for forget mode'
										})
									}

									const scope = args.scope || 'project'

									const result = await supermemoryClient.deleteMemory(args.memoryId)

									if (!result.success) {
										return JSON.stringify({
											success: false,
											error: result.error || 'Failed to delete memory'
										})
									}

									return JSON.stringify({
										success: true,
										message: `Memory ${args.memoryId} removed from ${scope} scope`
									})
								}
							}
						} catch (error) {
							return JSON.stringify({
								success: false,
								error: error instanceof Error ? error.message : String(error)
							})
						}
					}
				})
			}
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

				if (err) console.error(err.message)
			}
		}
	}
}

export default Index
