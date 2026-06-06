import { convertToModelMessages } from 'ai'

import pickMembers from '../runtime/pickMembers'

import type Session from '../../../session'
import type { Message } from '../../../types'
import type { GroupMemberEvaluation, GroupReplyQueueItem } from '../types'

const pickPriorityWaitMs = 4000

export interface GroupQueue {
	s: Session
	message: Message
	turnId: string
	baseMessages: Awaited<ReturnType<typeof convertToModelMessages>>
	evaluations: Map<string, GroupMemberEvaluation>
	candidateIds: Array<string>
	abort: AbortController
	getExclusiveId: () => string | null
	setExclusiveId: (agent_id: string | null) => void
	getCandidateRank: (agent_id: string) => number
	isEvaluationCompleted: (agent_id: string) => boolean
	allEvaluationsFinished: () => boolean
	waitForQueue: () => Promise<void>
	waitForQueueOrTimeout: (timeout?: number) => Promise<void>
	updateQueueItem: (item: GroupReplyQueueItem, patch: Partial<GroupReplyQueueItem>) => Promise<void>
	setQueue: (items: Array<GroupReplyQueueItem>) => Promise<void>
	closeEvaluationGate: () => void
	markEvaluationCompleted: (agent_id: string) => void
	enqueueEvaluation: (evaluation: GroupMemberEvaluation) => Promise<void>
	notifyQueue: () => void
}

export default async (s: Session, message: Message, turnId: string): Promise<GroupQueue> => {
	const baseMessages = await convertToModelMessages(s.model_messages)
	const evaluations = new Map<string, GroupMemberEvaluation>()
	const defaultCandidateIds = s.agents.map(agent => agent.id)
	const pickResult = await pickMembers(s, baseMessages)
	const candidateIds = pickResult.is_fallback ? defaultCandidateIds : pickResult.candidate_agent_ids
	const candidateRank = new Map(candidateIds.map((agent_id, index) => [agent_id, index]))
	const totalEvaluations = candidateIds.length
	let queueWaiter = null as null | (() => void)
	let completedEvaluations = 0
	const completedCandidateIds = new Set<string>()
	let exclusiveAgentId = null as string | null
	let evaluationGateClosed = false
	const abort = new AbortController()

	const notifyQueue = () => {
		queueWaiter?.()
		queueWaiter = null
	}

	const waitForQueue = () =>
		new Promise<void>(resolve => {
			queueWaiter = resolve
		})

	const waitForQueueOrTimeout = (timeout = pickPriorityWaitMs) =>
		new Promise<void>(resolve => {
			let settled = false
			const onQueue = () => {
				if (settled) {
					return
				}

				settled = true
				clearTimeout(timer)
				queueWaiter = null
				resolve()
			}
			const timer = setTimeout(() => {
				if (settled) {
					return
				}

				settled = true

				if (queueWaiter === onQueue) {
					queueWaiter = null
				}

				resolve()
			}, timeout)

			queueWaiter = onQueue
		})

	const updateQueueItem = async (item: GroupReplyQueueItem, patch: Partial<GroupReplyQueueItem>) => {
		Object.assign(item, patch)
		await s.setState()
		s.sync()
	}

	const setQueue = async (items: Array<GroupReplyQueueItem>) => {
		s.reply_queue = items.map((item, index) => {
			item.queue_index = index

			return item
		})
		await s.setState()
		s.sync()
	}

	const closeEvaluationGate = () => {
		if (evaluationGateClosed) {
			return
		}

		evaluationGateClosed = true
		abort.abort()
		notifyQueue()
	}

	const abortSessionQueue = () => {
		closeEvaluationGate()
	}

	if (s.abort_controller.signal.aborted) {
		abortSessionQueue()
	} else {
		s.abort_controller.signal.addEventListener('abort', abortSessionQueue, { once: true })
	}

	const markEvaluationCompleted = (agent_id: string) => {
		if (completedCandidateIds.has(agent_id)) {
			return
		}

		completedCandidateIds.add(agent_id)
		completedEvaluations += 1
	}

	const enqueueEvaluation = async (evaluation: GroupMemberEvaluation) => {
		if (!evaluation.should_answer) {
			return
		}

		if (s.active_turn_id !== turnId || s.manual_abort) {
			return
		}

		if (s.reply_queue.some(item => item.turn_id === turnId && item.agent_id === evaluation.agent.id)) {
			return
		}

		const nextItem = {
			turn_id: turnId,
			queue_index: s.reply_queue.length,
			agent_id: evaluation.agent.id,
			agent_name: evaluation.agent.name,
			status: 'queued',
			reason: evaluation.reason,
			confidence: evaluation.confidence,
			leadership: evaluation.leadership,
			exclusive: evaluation.exclusive,
			needs_write_lock: evaluation.needs_write_lock,
			enqueued_at: Date.now(),
			started_at: null,
			finished_at: null,
			error: null
		} satisfies GroupReplyQueueItem

		if (exclusiveAgentId && exclusiveAgentId !== evaluation.agent.id) {
			return
		}

		await setQueue([...s.reply_queue, nextItem])
		notifyQueue()
	}

	return {
		s,
		message,
		turnId,
		baseMessages,
		evaluations,
		candidateIds,
		abort,
		getExclusiveId: () => exclusiveAgentId,
		setExclusiveId: agent_id => {
			exclusiveAgentId = agent_id
		},
		getCandidateRank: agent_id => candidateRank.get(agent_id) ?? Number.MAX_SAFE_INTEGER,
		isEvaluationCompleted: agent_id => completedCandidateIds.has(agent_id),
		allEvaluationsFinished: () => evaluationGateClosed || completedEvaluations >= totalEvaluations,
		waitForQueue,
		waitForQueueOrTimeout,
		updateQueueItem,
		setQueue,
		closeEvaluationGate,
		markEvaluationCompleted,
		enqueueEvaluation,
		notifyQueue
	}
}
