import { SessionStore, SessionStreamStore } from '@core/utils'
import { createUIMessageStream, JsonToSseTransformStream } from 'ai'

import type { HonoContext } from '@core/types'

export const post = async (c: HonoContext) => {
	const { id, messages } = await c.req.json<{ id: string; messages: any }>()

	const store_chat = SessionStore.get(id)!
	const chat_stream = await store_chat.getStream(messages)

	const target_stream = await SessionStreamStore.resumableStream(id, () =>
		chat_stream.pipeThrough(new JsonToSseTransformStream())
	)

	if (!target_stream) return c.body(null)

	return c.newResponse(target_stream)
}

export const get = async (c: HonoContext) => {
	const id = c.req.query('id')

	if (!id) return c.body(null)

	if (!SessionStreamStore.hasExistingStream(id)) return c.body(null)

	const empty_stream = createUIMessageStream({ execute: () => {} })

	const store_stream = await SessionStreamStore.resumableStream(id, () =>
		empty_stream.pipeThrough(new JsonToSseTransformStream())
	)

	return c.newResponse(store_stream)
}
