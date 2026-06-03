import type { UIMessageChunk } from 'ai'
import type { MessageDataParts, MessageMetadata } from '../../../types'
import type { GroupMemberEvaluation } from '../types'
import type { GroupQueue } from './createGroupQueue'

const max_visible_errors = 3

const getEvaluationFailures = (queue: GroupQueue) => {
	return Array.from(queue.evaluations.values()).filter(
		evaluation => typeof evaluation.error_message === 'string' && evaluation.error_message.trim().length > 0
	)
}

const buildFailureText = (evaluations: Array<GroupMemberEvaluation>) => {
	const lines = [
		'Group reply failed before any member could answer.',
		'Member evaluation failed, so no agent was admitted into the group reply queue.'
	]
	const visible_errors = evaluations.slice(0, max_visible_errors)

	for (const evaluation of visible_errors) {
		lines.push(`- ${evaluation.agent.name}: ${evaluation.error_message}`)
	}

	if (evaluations.length > visible_errors.length) {
		lines.push(`- ${evaluations.length - visible_errors.length} more member evaluation errors omitted`)
	}

	lines.push('Check the failing provider or model binding for these group members and try again.')

	return lines.join('\n')
}

const writeTextChunk = (args: {
	writer: { write: (chunk: UIMessageChunk<MessageMetadata, MessageDataParts>) => void }
	id: string
	text: string
}) => {
	const { writer, id, text } = args

	writer.write({ type: 'text-start', id })
	writer.write({ type: 'text-delta', id, delta: text })
	writer.write({ type: 'text-end', id })
}

export default async (args: {
	queue: GroupQueue
	writer: { write: (chunk: UIMessageChunk<MessageMetadata, MessageDataParts>) => void }
}) => {
	const failures = getEvaluationFailures(args.queue)

	if (failures.length === 0) {
		return false
	}

	const text = buildFailureText(failures)

	writeTextChunk({
		writer: args.writer,
		id: `group-evaluation-failure-${args.queue.turnId}`,
		text
	})

	return true
}
