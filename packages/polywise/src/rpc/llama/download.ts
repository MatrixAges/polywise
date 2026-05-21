import { env } from '@core/env'
import { initLlama } from '@core/llama'
import { getEmbeddingModel, getGenModel, getRerankModel } from '@core/llama/getModel'
import { p } from '@core/utils'
import { enum as Enum } from 'zod'

const input_type = Enum(['embedding', 'rerank', 'gen'])

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/llama/download',
			summary: 'Run Download'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		await initLlama()

		switch (input) {
			case 'embedding':
				getEmbeddingModel(env.llama)
				break
			case 'rerank':
				getRerankModel(env.llama)
				break
			case 'gen':
				getGenModel(env.llama)
				break
		}
	})
