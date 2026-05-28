import { createUIMessageStream } from 'ai'
import { getId } from 'stk/utils'

import acceptInput from '../../../session/caps/exec/acceptInput'
import runHooks from '../../../session/hooks/runHooks'
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

	return createUIMessageStream({
		originalMessages: [message],
		generateId: getId,
		execute: async ({ writer }) => {
			try {
				await runGroupQueue({
					s,
					message,
					writer,
					turnId
				})
			} finally {
				await finishGroupRun(s, message)
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
