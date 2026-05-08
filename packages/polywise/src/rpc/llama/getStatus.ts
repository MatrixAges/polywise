import { hasEmbeddingModel, hasGenModel, hasRerankModel } from '@core/llama/getModel'
import { p } from '@core/utils'
import { boolean, enum as Enum, infer as Infer, record } from 'zod'

const output_type = record(Enum(['embedding', 'rerank', 'gen']), boolean())

export type ModelStatus = Infer<typeof output_type>

export default p.output(output_type).query(async () => {
	const [embedding, rerank, gen] = await Promise.all([hasEmbeddingModel(), hasRerankModel(), hasGenModel()])

	return { embedding: embedding ? true : false, rerank: rerank ? true : false, gen: gen ? true : false }
})
