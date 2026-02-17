import path from 'path'
import to from 'await-to-js'
import { Polywise } from 'polywise'
import { container } from 'tsyringe'

import { getLastAIMessages, getMetadata, getTextPart } from './utils'

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

			const { knowledges, actions, metadata } = res

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

			if (knowledges.length > 0) {
				output.parts.push({
					...common,
					id: `polywise-memory-${Date.now()}`,
					text: `Related Memory: ${JSON.stringify(knowledges)}`
				})
			}

			if (actions.length > 0) {
				output.parts.push({
					...common,
					id: `polywise-actions-${Date.now()}`,
					text: `Related Memory: ${JSON.stringify(actions)}`
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
		event: async ({ event }) => {
			if (event.type === 'session.idle') {
				const id = event.properties.sessionID

				const { error, data } = await ctx.client.session.messages({
					path: { id },
					query: { limit: 10 }
				})

				if (error) return console.error(error)

				const parts = data[0].parts as Array<TextPart>
				const output = parts
					.filter(p => p.type === 'text' && !p.synthetic && !p.id?.startsWith('polywise-'))
					.map(p => p.text)
					.join('\n')

				if (!output.trim()) return

				const last_messages = getLastAIMessages(data)
				const metadata = getMetadata(last_messages)
				const others = {}

				console.log('--------------')
				console.log('Content: ', output)
				console.log('Metadata: ', JSON.stringify(metadata))
				console.log('--------------')

				if (metadata) others['metadata'] = metadata

				try {
					await poly.save({ metrics_ids: [project_id], content: output, ...others })
				} catch (err) {
					console.error(err.message)
				}
			}
		}
	}
}

export default Index
