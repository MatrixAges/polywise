import { env } from '@core/env'
import { initLlama } from '@core/llama'
import { getEmbeddingModel, getGenModel, getRerankModel } from '@core/llama/getModel'
import { p } from '@core/utils'
import { boolean, enum as Enum, record } from 'zod'

const output_type = record(Enum(['embedding', 'rerank', 'gen']), boolean())

export default p.output(output_type).query(async () => {
	await initLlama()

	const [embedding, rerank, gen] = await Promise.all([
		getEmbeddingModel(env.llama, true),
		getRerankModel(env.llama, true),
		getGenModel(env.llama, true)
	])

	return { embedding: embedding ? true : false, rerank: rerank ? true : false, gen: gen ? true : false }
})
