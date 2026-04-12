import checkChaos from './checkChaos'
import { streams } from './streams'

import type { Message } from '../../types'

const CHAOS_CHECK_DELAY = 60000
const CHAOS_CHECK_INTERVAL = 30000

export default async () => {
	const now = Date.now()

	for (const [session_id, info] of streams.entries()) {
		if (info.chaos_detected) {
			streams.delete(session_id)

			continue
		}

		const elapsed = now - info.start_time
		const time_since_last_check = now - info.last_check_time

		if (elapsed >= CHAOS_CHECK_DELAY && time_since_last_check >= CHAOS_CHECK_INTERVAL) {
			info.last_check_time = now

			try {
				const is_chaos = await checkChaos(info.recent_parts, info.session.model.model)

				if (is_chaos) {
					await info.session.abortStream()

					const correction_message: Message = {
						id: `correction_${Date.now()}`,
						role: 'user',
						parts: [
							{
								type: 'text',
								text: `[System Auto-Correction] Detected that the previous conversation was stuck in a chaotic loop. Please reorganize your thoughts and start answering from scratch based on the user's original question. The user's question is: ${JSON.stringify(info.message)}`
							}
						]
					}

					await info.session.getStream(correction_message)
					streams.delete(session_id)
				}
			} catch {
				streams.delete(session_id)
			}
		}
	}
}
