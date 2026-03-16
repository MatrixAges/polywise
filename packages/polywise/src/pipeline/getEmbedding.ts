import { addTask, initEmbeddingModel, removeTask } from '@core/llama'

import { env } from '../env'

export default async (text: string) => {
	await initEmbeddingModel()

	const task_id = addTask('embedding')

	const res = await env.embedding_context.getEmbeddingFor(text)

	removeTask('embedding', task_id)

	return res.vector as Array<number>
}
