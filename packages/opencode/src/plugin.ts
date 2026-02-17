import path from 'path'
import to from 'await-to-js'
import { Polywise } from 'polywise'

import type { Plugin } from '@opencode-ai/plugin'

const saved_messages = new Set<string>()

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
		'tui.prompt.append': async (input: AppendArgs, output: AppendArgs) => {
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
		},

		event: async ({ event }) => {
			if (event.type === 'session.idle') {
				const session = (event as any).session

				if (!session || !session.messages) return

				for (const msg of session.messages) {
					if (msg.role === 'assistant' && msg.content && (!msg.id || !saved_messages.has(msg.id))) {
						const [err] = await to(
							poly.save({
								content: msg.content,
								metrics_ids: [project_id],
								metadata: {
									timestamp: Date.now(),
									role: msg.role,
									message_id: msg.id,
									files: msg.files || [],
									...msg.metadata
								}
							})
						)

						if (err)
							return console.error('[@polywise/opencode-plugin] Save failed:', err.message)

						if (msg.id) saved_messages.add(msg.id)
					}
				}
			}
		}
	}
}
