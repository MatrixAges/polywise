import path from 'path'
import to from 'await-to-js'
import { Polywise } from 'polywise'

import { getTextPart } from './utils'

import type { Plugin } from '@opencode-ai/plugin'
import type { TextPart } from '@opencode-ai/sdk'

const Index: Plugin = async ctx => {
	const { project, directory } = ctx
	const project_id = project.id || path.basename(directory)

	const poly = new Polywise()

	await poly.init({
		data_dir: path.join(directory, '.polywise'),
		metrics_ids: [project_id]
	})

	return {
		'chat.message': async (input, output) => {
			const query = getTextPart(output.parts)

			const [err, res] = await to(
				poly.query({
					query,
					metrics_ids: [project_id]
				})
			)

			if (err) return console.error(err.message)

			const { knowledges, actions, metadata } = res

			console.log('[PolywisePlugin] memory find: ', JSON.stringify(res))

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
					query: { limit: 1 }
				})

				if (error) return console.error(error)

				const output = getTextPart(data[0].parts)

				const [err] = await to(poly.save({ content: output }))

				if (err) return console.error(err.message)
			}
		}
	}
}

export default Index
