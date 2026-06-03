import createGroupQueue from './createGroupQueue'
import emitGroupEvaluationFailure from './emitGroupEvaluationFailure'
import processGroupQueue from './processGroupQueue'
import runGroupEvaluations from './runGroupEvaluations'

import type Session from '../../../session'
import type { Message } from '../../../types'

export default async (args: {
	s: Session
	message: Message
	writer: {
		merge: (stream: ReadableStream) => void
		write: (chunk: any) => void
	}
	turnId: string
}) => {
	const queue = await createGroupQueue(args.s, args.message, args.turnId)

	await runGroupEvaluations(queue)

	if (queue.s.reply_queue.length === 0) {
		return await emitGroupEvaluationFailure({
			queue,
			writer: args.writer
		})
	}

	await processGroupQueue(queue, args.writer)

	return false
}
