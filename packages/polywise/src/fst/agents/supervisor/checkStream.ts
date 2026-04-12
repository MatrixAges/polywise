import { SessionStreamStore } from '@core/utils'
import { convertToModelMessages, JsonToSseTransformStream } from 'ai'
import { getId } from 'stk/utils'

import checkChaos from './checkChaos'
import { streams } from './streams'

import type { Message } from '../../types'

const CHAOS_CHECK_DELAY = 60000
const CHAOS_CHECK_INTERVAL = 30000

export default async () => {
	const now = Date.now()

	for (const [session_id, info] of streams.entries()) {
		const elapsed = now - info.start_time
		const time_since_last_check = now - info.last_check_time

		if (
			info.chaos_detected ||
			(elapsed >= CHAOS_CHECK_DELAY && time_since_last_check >= CHAOS_CHECK_INTERVAL)
		) {
			info.last_check_time = now

			try {
				const is_chaos = await checkChaos(info.recent_parts, info.session.model.model)

				if (is_chaos) {
					const original_message = (await convertToModelMessages([info.message as Message]))[0]

					await info.session.abortStream()

					info.session.resetAbort()

					const correction_message: Message = {
						id: getId(),
						role: 'user' as const,
						parts: [
							{
								type: 'text' as const,
								text: `[System Auto-Correction] Detected that the previous conversation was stuck in a chaotic loop. Please reorganize your thoughts and start answering from scratch based on the user's original question. The user's question is: ${original_message.content}`
							}
						]
					}

					const stream = await info.session.getStream(correction_message)

					await SessionStreamStore.resumableStream(session_id, () =>
						stream.pipeThrough(new JsonToSseTransformStream())
					)

					info.session.sync()

					streams.delete(session_id)
				} else {
					info.chaos_detected = false
				}
			} catch {
				streams.delete(session_id)
			}
		}
	}
}
