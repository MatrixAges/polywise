import path from 'path'
import to from 'await-to-js'
import { Polywise } from 'polywise'

import type { Plugin } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk'

interface AppendArgs {
	text: string
}

export const OpencodePolywisePlugin: Plugin = async ctx => {
	const { project, directory } = ctx
	const project_id = project.id || path.basename(directory)

	const poly = new Polywise()

	await poly.init({
		data_dir: path.join(directory, '.polywise'),
		metrics_ids: [project_id]
	})

	return {
		'chat.message': async (input, output) => {
			console.log(input)

			const textParts = output.parts.filter(
				(p): p is Part & { type: 'text'; text: string } => p.type === 'text'
			)

			const [err, { knowledges, actions, metadata }] = await to(
				poly.query({
					query: input.text,
					metrics_ids: [project_id]
				})
			)

			if (err) return console.error(err.message)

			if (knowledges.length > 0) {
				output.text += `Related Memory: ${JSON.stringify(knowledges)}`
			}

			if (actions.length > 0) {
				output.text += `Suggest Actions: ${JSON.stringify(actions)}`
			}

			if (metadata) {
				output.text += `Related Metadata: ${JSON.stringify(actions)}`
			}

			console.log(output)
		},
		event: async ({ event }) => {
			if (event.type === 'session.idle') {
				const id = event.properties.sessionID

				console.log(`[PolywisePlugin] Session idle, fetching messages for: ${id}`)

				const { error, data } = await ctx.client.session.messages({
					path: { id },
					query: { limit: 1 }
				})

				if (error) return

				console.log(`[PolywisePlugin] Session messages: ${JSON.stringify(data)}`)
			}
		}
	}
}
