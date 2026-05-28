import createGroupQueue from './createGroupQueue'
import processGroupQueue from './processGroupQueue'
import runGroupEvaluations from './runGroupEvaluations'

import type Session from '../../../session'
import type { Message } from '../../../types'

export default async (args: {
	s: Session
	message: Message
	writer: { merge: (stream: ReadableStream) => void }
	turnId: string
}) => {
	const queue = await createGroupQueue(args.s, args.message, args.turnId)
	const queueRunner = processGroupQueue(queue, args.writer)

	await runGroupEvaluations(queue)
	await queueRunner
}
