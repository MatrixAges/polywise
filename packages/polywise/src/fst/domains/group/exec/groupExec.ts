import { createUIMessageStream } from 'ai'
import { getId } from 'stk/utils'

import acceptInput from '../../../session/caps/exec/acceptInput'
import runHooks from '../../../session/hooks/runHooks'
import hasMeaningfulAssistantMessage from '../../../utils/hasMeaningfulAssistantMessage'
import finishGroupRun from './finishGroupRun'
import runGroupQueue from './runGroupQueue'
import startGroupRun from './startGroupRun'

import type Session from '../../../session'
import type { Message } from '../../../types'

export default async (s: Session, message: Message) => {
	await s.getModel()
	await s.getAgents()
	await s.getFolders()
	await acceptInput(s, message)

	const turnId = await startGroupRun(s)
	await runHooks(s, 'onStart', { message, mode: 'group', turnId })

	let persist_outer_response = false

	return createUIMessageStream({
		originalMessages: [message],
		generateId: getId,
		execute: async ({ writer }) => {
			try {
				persist_outer_response = await runGroupQueue({
					s,
					message,
					writer,
					turnId
				})
			} finally {
				await finishGroupRun(s, message)
			}
		},
		onFinish: async ({ responseMessage }) => {
			if (!persist_outer_response) {
				return
			}

			responseMessage.metadata = {
				...(responseMessage.metadata ?? {}),
				timestamp: Date.now(),
				sender: 'System',
				sender_id: 'group_runtime',
				sender_role: 'Group Runtime',
				group_id: s.group_id,
				group_name: s.group!.name,
				group_turn_id: turnId,
				leadership: 'none'
			}

			if (hasMeaningfulAssistantMessage(responseMessage)) {
				await s.appendMessage(responseMessage)
				s.sync()
			}
		},
		onError: error => {
			void runHooks(s, 'onError', {
				error,
				manual: s.manual_abort
			})

			if (s.manual_abort) {
				s.manual_abort = false

				return ''
			}

			return `Group stream error: ${error instanceof Error ? error.message : String(error)}`
		}
	})
}
