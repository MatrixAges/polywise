import { connectSession, SessionStreamStore } from '@core/utils'
import { JsonToSseTransformStream } from 'ai'
import { getId } from 'stk/utils'

import type { ConnectSessionArgs } from '@core/utils/connectSession'

export default async (args: ConnectSessionArgs, text: string) => {
	console.log('[group-debug][submit] start', {
		session_id: args.id,
		text_preview: text.slice(0, 120)
	})

	const session = await connectSession(args)
	console.log('[group-debug][submit] connected', {
		session_id: args.id,
		session_type: session.constructor.name
	})

	const stream = await session.getStream({
		id: getId(),
		role: 'user',
		parts: [{ type: 'text', text }]
	})
	console.log('[group-debug][submit] stream-created', {
		session_id: args.id
	})

	await SessionStreamStore.resumableStream(args.id, () => stream.pipeThrough(new JsonToSseTransformStream()))
	console.log('[group-debug][submit] resumable-stream-finished', {
		session_id: args.id
	})
}
