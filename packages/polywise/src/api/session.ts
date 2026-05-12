import { Group } from '@core/fst'
import { GroupStreamStore, SessionStreamStore } from '@core/utils'
import { createUIMessageStream, JsonToSseTransformStream } from 'ai'

import { connectSession } from '../utils'

import type { Message } from '@core/fst'
import type { HonoContext } from '@core/types'

export const post = async (c: HonoContext) => {
	const { id, message } = await c.req.json<{ id: string; message: Message }>()

	const session = await connectSession({ id })

	const stream = await session.getStream(message)
	const target_store = session instanceof Group ? GroupStreamStore : SessionStreamStore

	const target_stream = await target_store.resumableStream(id, () =>
		stream.pipeThrough(new JsonToSseTransformStream())
	)

	if (!target_stream) return c.body(null)

	return c.newResponse(target_stream)
}

export const get = async (c: HonoContext) => {
	const id = c.req.query('id')

	if (!id) return c.body(null)

	const session = await connectSession({ id })
	const target_store = session instanceof Group ? GroupStreamStore : SessionStreamStore

	if (!target_store.hasExistingStream(id)) return c.body(null)

	const empty_stream = createUIMessageStream({ execute: () => {} })

	const store_stream = await target_store.resumableStream(id, () =>
		empty_stream.pipeThrough(new JsonToSseTransformStream())
	)

	return c.newResponse(store_stream)
}
