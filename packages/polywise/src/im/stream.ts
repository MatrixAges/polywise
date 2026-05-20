import {
	discord_message_placeholder,
	feishu_stream_edit_interval_ms,
	im_stream_edit_interval_ms,
	im_typing_keepalive_ms
} from './config'
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
	const stream_edit_interval_ms =
		adapter.platform === 'feishu' ? feishu_stream_edit_interval_ms : im_stream_edit_interval_ms
	const ordered_part_ids = [] as Array<string>
	const part_state_by_id = new Map<
		string,
		{
			text: string
			receipt: ImSendReceipt | null
			last_edit_at: number
		}
	>()
	let last_typing_at = 0

	const ensurePartState = (part_id: string) => {
		let part_state = part_state_by_id.get(part_id)

		if (part_state) {
			return part_state
		}

		part_state = {
			text: '',
			receipt: null,
			last_edit_at: 0
		}
		part_state_by_id.set(part_id, part_state)
		ordered_part_ids.push(part_id)

		return part_state
	}

	while (true) {
		const { done, value } = await reader.read()

		if (done) break

		const chunk = value as { type?: string; delta?: string; id?: string }
		const part_id = String(chunk.id || 'default')

		if (chunk.type === 'text-start') {
			ensurePartState(part_id)
		}

		if (chunk.type === 'text-delta' && typeof chunk.delta === 'string') {
			const part_state = ensurePartState(part_id)
			part_state.text += chunk.delta
		}

		if (adapter.capabilities.typing && Date.now() - last_typing_at >= im_typing_keepalive_ms) {
			last_typing_at = Date.now()
			await adapter.sendTyping(route).catch(() => null)
		}

		if (!adapter.capabilities.message_edit) continue
		if (chunk.type !== 'text-delta') continue

		const part_state = part_state_by_id.get(part_id)

		if (!part_state?.text.trim()) continue

		const now = Date.now()
		if (now - part_state.last_edit_at < stream_edit_interval_ms) continue

		part_state.last_edit_at = now

		if (!part_state.receipt) {
			part_state.receipt = await adapter.sendMessage({
				route,
				text: part_state.text.trim() || discord_message_placeholder
			})
			continue
		}

		if (adapter.editMessage) {
			part_state.receipt = await adapter.editMessage({
				route,
				receipt: part_state.receipt,
				text: part_state.text.trim() || discord_message_placeholder
			})
		}
	}

	const response_message = (await waitForAssistantMessage(session, baseline_message_count)) as
		| FstMessage
		| undefined
	const streamed_parts = ordered_part_ids
		.map(part_id => part_state_by_id.get(part_id)?.text.trim() || '')
		.filter(Boolean)
	const final_text = streamed_parts.join('\n\n') || extractAssistantText(response_message)

	if (adapter.capabilities.message_edit) {
		let has_delivered_part = false

		for (const part_id of ordered_part_ids) {
			const part_state = part_state_by_id.get(part_id)
			const part_text = part_state?.text.trim()

			if (!part_text) {
				continue
			}

			has_delivered_part = true

			if (part_state?.receipt && adapter.editMessage) {
				part_state.receipt = await adapter.editMessage({
					route,
					receipt: part_state.receipt,
					text: part_text || discord_message_placeholder
				})
				continue
			}

			part_state!.receipt = await adapter.sendMessage({
				route,
				text: part_text || discord_message_placeholder
			})
		}

		if (!has_delivered_part) {
			await sendFinalMessage(adapter, route, final_text)
		}
	} else {
		await sendFinalMessage(adapter, route, final_text)
	}

	return {
		response_message,
		final_text
	}
}
