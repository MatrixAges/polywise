import { discord_message_placeholder, im_stream_edit_interval_ms, im_typing_keepalive_ms } from './config'
import { extractAssistantText } from './message'
import { sleep } from './utils'

import type Session from '@core/fst/session'
import type { Message as FstMessage } from '@core/fst/types'
import type { ImAdapter, ImRoute, ImRouteExecutionResult, ImSendReceipt } from './types'

const sendFinalMessage = async (adapter: ImAdapter, route: ImRoute, text: string) => {
	return adapter.sendMessage({ route, text: text.trim() || discord_message_placeholder })
}

const waitForAssistantMessage = async (session: Session, baseline_message_count: number) => {
	for (let attempt = 0; attempt < 40; attempt++) {
		const response_message = session.ui_messages.at(-1)

		if (response_message?.role === 'assistant' && session.ui_messages.length > baseline_message_count) {
			return response_message
		}

		await sleep(25)
	}

	const fallback = session.ui_messages.at(-1)
	return fallback?.role === 'assistant' ? fallback : undefined
}

export const deliverImSessionStream = async (args: {
	adapter: ImAdapter
	route: ImRoute
	stream: ReadableStream<unknown>
	session: Session
	baseline_message_count: number
}): Promise<ImRouteExecutionResult> => {
	const { adapter, route, stream, session, baseline_message_count } = args
	const reader = stream.getReader()
	let draft_receipt: ImSendReceipt | null = null
	let draft_text = ''
	let last_edit_at = 0
	let last_typing_at = 0

	while (true) {
		const { done, value } = await reader.read()

		if (done) break

		const chunk = value as { type?: string; delta?: string }

		if (chunk.type === 'text-delta' && typeof chunk.delta === 'string') {
			draft_text += chunk.delta
		}

		if (adapter.capabilities.typing && Date.now() - last_typing_at >= im_typing_keepalive_ms) {
			last_typing_at = Date.now()
			await adapter.sendTyping(route).catch(() => null)
		}

		if (!adapter.capabilities.message_edit) continue
		if (!draft_text.trim()) continue
		if (Date.now() - last_edit_at < im_stream_edit_interval_ms) continue

		last_edit_at = Date.now()

		if (!draft_receipt) {
			draft_receipt = await adapter.sendMessage({
				route,
				text: draft_text.trim() || discord_message_placeholder
			})
			continue
		}

		if (adapter.editMessage) {
			draft_receipt = await adapter.editMessage({
				route,
				receipt: draft_receipt,
				text: draft_text.trim() || discord_message_placeholder
			})
		}
	}

	const response_message = (await waitForAssistantMessage(session, baseline_message_count)) as
		| FstMessage
		| undefined
	const final_text = draft_text.trim() || extractAssistantText(response_message)

	if (adapter.capabilities.message_edit && draft_receipt && adapter.editMessage) {
		draft_receipt = await adapter.editMessage({
			route,
			receipt: draft_receipt,
			text: final_text || discord_message_placeholder
		})
	} else {
		await sendFinalMessage(adapter, route, final_text)
	}

	return {
		response_message,
		final_text
	}
}
