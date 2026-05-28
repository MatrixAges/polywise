import evaluateMember from '../runtime/evaluateMember'

import type { GroupQueue } from './createGroupQueue'

export default async (queue: GroupQueue) => {
	const { s } = queue

	const runEvaluation = async (agent_id: string) => {
		const agent = s.agents.find(item => item.id === agent_id)

		if (!agent) {
			queue.markEvaluationCompleted(agent_id)
			queue.notifyQueue()
			return
		}

		if (queue.getExclusiveId() && queue.getExclusiveId() !== agent.id) {
			queue.markEvaluationCompleted(agent.id)
			queue.notifyQueue()
			return
		}

		const evaluation = await evaluateMember(s, agent, queue.baseMessages, {
			abort_signal: queue.abort.signal
		})
		queue.markEvaluationCompleted(agent.id)

		if (s.active_turn_id !== queue.turnId) {
			queue.notifyQueue()
			return
		}

		if (queue.getExclusiveId() && queue.getExclusiveId() !== agent.id) {
			queue.notifyQueue()
			return
		}

		queue.evaluations.set(agent.id, evaluation)
		await queue.enqueueEvaluation(evaluation)
		queue.notifyQueue()
	}

	await Promise.allSettled(queue.candidateIds.map(agent_id => runEvaluation(agent_id)))
	queue.notifyQueue()
}
