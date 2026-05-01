import { connectSession, SessionStreamStore } from '@core/utils'
import { JsonToSseTransformStream } from 'ai'
import { getId } from 'stk/utils'

import type { ConnectSessionArgs } from '@core/utils/connectSession'

export default async (args: ConnectSessionArgs, text: string) => {
	const session = await connectSession(args)

	const stream = await session.getStream({
		id: getId(),
		role: 'user',
		parts: [{ type: 'text', text }]
	})

	await SessionStreamStore.resumableStream(args.id, () => stream.pipeThrough(new JsonToSseTransformStream()))
}
