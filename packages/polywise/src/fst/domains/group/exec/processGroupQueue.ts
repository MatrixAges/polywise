import runMember from '../runtime/runMember'
import setBarrier from '../runtime/setBarrier'

import type { GroupReplyQueueItem } from '../types'
import type { GroupQueue } from './createGroupQueue'

export default async (queue: GroupQueue, writer: { merge: (stream: ReadableStream) => void }) => {
	const { s, message, turnId, evaluations, candidateIds } = queue

	while (!s.manual_abort && s.active_turn_id === turnId) {
		const queuedItems = s.reply_queue
			.filter(item => item.turn_id === turnId && item.status === 'queued')
			.sort((a, b) => {
				const rankDiff = queue.getCandidateRank(a.agent_id) - queue.getCandidateRank(b.agent_id)

				if (rankDiff !== 0) {
					return rankDiff
				}

				if (a.exclusive !== b.exclusive) {
					return a.exclusive ? -1 : 1
				}

				return a.enqueued_at - b.enqueued_at
			})
		const next = queuedItems[0]

		if (!next) {
			if (queue.allEvaluationsFinished()) {
				break
			}

			await queue.waitForQueue()
			continue
		}

		const higherPriorityPendingIds = candidateIds
			.slice(0, queue.getCandidateRank(next.agent_id))
			.filter(agent_id => !queue.isEvaluationCompleted(agent_id))

		if (higherPriorityPendingIds.length > 0 && !queue.allEvaluationsFinished()) {
			await queue.waitForQueueOrTimeout()
			continue
		}

		if (next.exclusive && queue.getExclusiveId() !== next.agent_id) {
			queue.setExclusiveId(next.agent_id)
			await queue.setQueue(
				s.reply_queue.filter(
					item =>
						item.turn_id !== turnId ||
						item.status !== 'queued' ||
						item.agent_id === next.agent_id
				)
			)
			queue.closeEvaluationGate()
		}

		const waitingAgentIds = s.reply_queue
			.filter(
				item => item.turn_id === turnId && item.status === 'queued' && item.agent_id !== next.agent_id
			)
			.map(item => item.agent_id)

		await setBarrier(s, {
			leader_agent_id: next.agent_id,
			leader_agent_name: next.agent_name,
			leadership: next.leadership,
			waiting_agent_ids: waitingAgentIds,
			reason: next.reason
		})
		await queue.updateQueueItem(next, {
			status: 'running',
			started_at: Date.now()
		})

		const evaluation = evaluations.get(next.agent_id)

		if (!evaluation) {
			await queue.updateQueueItem(next, {
				status: 'failed',
				finished_at: Date.now(),
				error: 'evaluation missing'
			})
			continue
		}

		try {
			const member = await runMember({
				s,
				agent: evaluation.agent,
				evaluation,
				messages: queue.baseMessages,
				original_message: message,
				turn_id: turnId
			})

			writer.merge(member.stream)
			await member.done

			await queue.updateQueueItem(next, {
				status: 'done',
				finished_at: Date.now()
			})
		} catch (error) {
			await queue.updateQueueItem(next, {
				status: 'failed',
				finished_at: Date.now(),
				error: error instanceof Error ? error.message : String(error)
			})
		}
	}

	await setBarrier(s, null)
}
