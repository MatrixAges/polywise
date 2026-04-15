import { addTask, initEmbeddingModel, removeTask } from '@core/llama'

import { env } from '../env'
import genEmbedding from './genEmbedding'

export default async (text: string) => {
	const run = await genEmbedding()

	if (run) return run(text)

	await initEmbeddingModel()

	const task_id = addTask('embedding')

	const res = await env.embedding_context.getEmbeddingFor(text)

	removeTask('embedding', task_id)

	return res.vector as Array<number>
}
